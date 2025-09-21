
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut, getIdToken } from "firebase/auth";
import { auth, db } from '@/firebase/config';
import { doc, onSnapshot, serverTimestamp, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { UserProfile } from '@/models/user.model';
import { Loader2 } from 'lucide-react';
import { createAgentProfile } from '@/services/user-agent-service';
import Cookies from 'js-cookie';

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
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in.
        const superAdminCheck = firebaseUser.email === SUPER_ADMIN_EMAIL;
        setUser(firebaseUser);
        setIsSuperAdmin(superAdminCheck);

        // Listen for user profile changes
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
            setIsAgent(!!profile.isAgent || superAdminCheck); // Agent if profile says so or is super admin
            updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {});
          } else if (superAdminCheck) {
            // If super admin has no profile, create it.
            createAgentProfile(firebaseUser.uid, firebaseUser.email!, "Super Admin").catch(console.error);
          }
           // The loading state will be handled by the redirection logic below.
        }, (error) => {
          console.error("Auth context profile listener error:", error);
          setUserProfile(null);
          setLoading(false);
        });

        // Set session cookie
        getIdToken(firebaseUser).then((token) => {
          fetch('/api/auth', { method: 'POST', body: JSON.stringify({ idToken: token }) });
        });

        return () => unsubscribeProfile();
      } else {
        // User is signed out.
        fetch('/api/auth', { method: 'DELETE' });
        setUser(null);
        setUserProfile(null);
        setIsAgent(false);
        setIsSuperAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (loading) return; // Don't do anything until auth state is resolved

    const isAuthRoute = pathname === '/login';
    const isPublicRoute = ['/landing', '/terms', '/privacy', '/refund', '/gst'].includes(pathname);
    const isAdminRoute = pathname.startsWith('/admin');

    if (!user) {
      // User is logged out. Redirect to landing if not on a public/auth route.
      if (!isAuthRoute && !isPublicRoute) {
        router.replace('/landing');
      }
    } else {
      // User is logged in.
      if (isAgent || isSuperAdmin) {
        if (!isAdminRoute) {
          // If agent/admin is not in admin area, redirect them there.
          router.replace('/admin/dashboard');
        }
      } else {
        // Regular user.
        if (isAdminRoute) {
          // If regular user tries to access admin, send to home.
          router.replace('/home');
        } else if (isAuthRoute || isPublicRoute) {
          // If on login or public page, send to home.
          router.replace('/home');
        }
      }
    }
  }, [user, userProfile, isAgent, isSuperAdmin, loading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle the state update and redirection.
  };

  const value = { user, userProfile, loading, logout, isSuperAdmin, isAgent };

  // While auth state is loading, always show the global loader.
  if (loading) {
    return <GlobalLoader />;
  }

  // Once loading is complete, the useEffect above will handle redirection.
  // We render children to prevent a flash of incorrect content during the redirect.
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
