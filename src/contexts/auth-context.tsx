
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
  authLoading: boolean;
  profileLoading: boolean;
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
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); // Default to true
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Step 1: Handle Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Step 2: Handle Profile, Roles, and Session based on Auth State
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setIsSuperAdmin(false);
      setIsAgent(false);
      setProfileLoading(false); // No profile to load
      fetch('/api/auth', { method: 'DELETE' }); // Clear the session cookie
      return;
    }

    setProfileLoading(true);

    const superAdminCheck = user.email === SUPER_ADMIN_EMAIL;
    setIsSuperAdmin(superAdminCheck);

    getIdToken(user, true).then((token) => {
      fetch('/api/auth', { method: 'POST', body: JSON.stringify({ idToken: token }) });
    });

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUserProfile(profile);
        setIsAgent(!!profile.isAgent || superAdminCheck);
        if (!profile.isAgent && !superAdminCheck) {
            updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {});
        }
      } else {
        setUserProfile(null); 
        setIsAgent(superAdminCheck); 
        if(superAdminCheck) {
            createAgentProfile(user.uid, user.email!, "Super Admin").catch(console.error);
        }
      }
      setProfileLoading(false);
    }, (error) => {
      console.error("Auth context profile listener error:", error);
      setUserProfile(null);
      setProfileLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  // Step 3: Handle redirection logic once all loading is complete
  useEffect(() => {
    // Wait for both auth and profile loading to finish
    if (authLoading || profileLoading) return; 

    const isAuthPage = pathname === '/login' || pathname === '/landing' || pathname === '/';
    const isAdminRoute = pathname.startsWith('/admin');

    if (user) {
        // User is authenticated
        const hasProfile = !!userProfile;
        const isDesignatedAgent = isAgent || isSuperAdmin;
        
        if (isDesignatedAgent) {
            // User is an agent or super admin
            if (!isAdminRoute) {
                router.replace('/admin/dashboard');
            }
        } else {
            // User is a regular user
            if (isAdminRoute) {
                router.replace('/home'); // Kick out of admin
            } else if (isAuthPage && hasProfile) {
                router.replace('/home'); // From login pages to home
            }
        }
    } else {
      // User is NOT authenticated
      if (!isAuthPage && !pathname.startsWith('/terms') && !pathname.startsWith('/privacy') && !pathname.startsWith('/refund') && !pathname.startsWith('/gst')) {
        router.replace('/landing');
      }
    }
  }, [user, userProfile, isAgent, isSuperAdmin, authLoading, profileLoading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
  };

  const value = { user, userProfile, authLoading, profileLoading, logout, isSuperAdmin, isAgent };
  
  return (
    <AuthContext.Provider value={value}>
      {authLoading || profileLoading ? <GlobalLoader /> : children}
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
