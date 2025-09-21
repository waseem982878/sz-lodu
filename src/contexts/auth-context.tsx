
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

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized. Check your environment variables.");
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      let profileUnsubscribe: (() => void) | undefined;

      if (firebaseUser) {
        setUser(firebaseUser);
        const superAdminCheck = firebaseUser.email === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(superAdminCheck);

        // Create or refresh session cookie.
        getIdToken(firebaseUser, true).then((token) => {
          fetch('/api/auth', { method: 'POST', body: JSON.stringify({ idToken: token }) });
        });

        const userRef = doc(db, 'users', firebaseUser.uid);
        profileUnsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
            const agentCheck = !!profile.isAgent;
            setIsAgent(agentCheck || superAdminCheck);
            // Update last seen timestamp without blocking.
            updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {});
          } else if (superAdminCheck) {
             createAgentProfile(firebaseUser.uid, firebaseUser.email!, "Super Admin").catch(console.error);
          }
          // No matter if profile exists or not, auth state is known.
          setLoading(false);
        }, (error) => {
          console.error("Auth context profile listener error:", error);
          setUserProfile(null);
          setLoading(false); // Stop loading even on error
        });
      } else {
        // User is signed out.
        fetch('/api/auth', { method: 'DELETE' }); // Clear session cookie
        setUser(null);
        setUserProfile(null);
        setIsAgent(false);
        setIsSuperAdmin(false);
        setLoading(false);
      }
      
      return () => {
        if (profileUnsubscribe) {
          profileUnsubscribe();
        }
      };
    });

    return () => unsubscribeAuth();
  }, []);
  
   useEffect(() => {
      if (loading) return; 

      const isAuthPage = pathname === '/login' || pathname === '/landing' || pathname === '/';
      const isAdminRoute = pathname.startsWith('/admin');

      if (user) {
          if (isSuperAdmin || isAgent) {
              if (!isAdminRoute) {
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
          if (!isAuthPage) {
              router.replace('/landing');
          }
      }

  }, [user, isAgent, isSuperAdmin, loading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
  };

  const value = { user, userProfile, loading, logout, isSuperAdmin, isAgent };
  
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
