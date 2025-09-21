
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut, getIdToken } from "firebase/auth";
import { auth, db } from '@/firebase/config';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { UserProfile } from '@/models/user.model';
import { Loader2 } from 'lucide-react';
import { createAgentProfile } from '@/services/user-agent-service';

// IMPORTANT: Set your super admin email here
const SUPER_ADMIN_EMAIL = "waseem982878@gmail.com";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function GlobalLoader() {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Effect 1: Handle Firebase auth state changes and profile listening ONLY.
  useEffect(() => {
    // Guard clause: If firebase auth is not initialized, do nothing.
    if (!auth) {
        console.error("Firebase Auth is not initialized. Check your environment variables.");
        setLoading(false);
        return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in, set basic info immediately.
        setUser(firebaseUser);
        const superAdminCheck = firebaseUser.email === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(superAdminCheck);

        // Create or refresh session cookie.
        getIdToken(firebaseUser, true).then((token) => {
          fetch('/api/auth', { method: 'POST', body: JSON.stringify({ idToken: token }) });
        });

        // Listen for profile changes in a separate process.
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
            const agentCheck = !!profile.isAgent;
            setIsAgent(agentCheck || superAdminCheck);
            // Update last seen timestamp without blocking.
            updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {});
          } else if (superAdminCheck) {
             // If super admin logs in for the first time, create their profiles.
             createAgentProfile(firebaseUser.uid, firebaseUser.email!, "Super Admin").catch(console.error);
          }
          // The loading state is no longer tied to the profile snapshot.
        }, (error) => {
          console.error("Auth context profile listener error:", error);
          setUserProfile(null);
        });
        
        setLoading(false); // <--- CRITICAL FIX: Stop loading as soon as auth state is known.

        return () => unsubscribeProfile();
      } else {
        // User is signed out.
        fetch('/api/auth', { method: 'DELETE' }); // Clear session cookie
        setUser(null);
        setUserProfile(null);
        setIsAgent(false);
        setIsSuperAdmin(false);
        setLoading(false); // Stop loading.
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  // Effect 2: Handle routing AFTER loading is complete.
  // This is the single source of truth for redirection.
   useEffect(() => {
      if (loading) return; // Don't do anything while loading.

      const isAuthPage = pathname === '/login' || pathname === '/landing' || pathname === '/';
      const isAdminRoute = pathname.startsWith('/admin');

      if (user) {
          // User is logged in
          if(isSuperAdmin || isAgent) {
              if(!isAdminRoute) {
                  router.replace('/admin/dashboard');
              }
          } else {
              if (isAdminRoute) {
                  router.replace('/home');
              } else if (isAuthPage) {
                  router.replace('/home');
              }
          }
      } else {
          // User is not logged in
          if (!isAuthPage) {
              router.replace('/landing');
          }
      }

  }, [user, loading, pathname, router, isAgent, isSuperAdmin]);


  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle state cleanup and redirection via the useEffect hooks.
  };

  const value = { user, userProfile, loading, logout, isSuperAdmin, isAgent };
  
  // Render based on loading state. The routing useEffect will handle redirection after load.
  if (loading) {
    return <GlobalLoader />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
