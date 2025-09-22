
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from '@/firebase/config';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { UserProfile } from '@/models/user.model';
import { Loader2 } from 'lucide-react';
import { updateUserProfile } from '@/services/user-agent-service';

// IMPORTANT: Set your admin email here
const ADMIN_EMAIL = "ludokingbattles@gmail.com";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const adminCheck = firebaseUser.email === ADMIN_EMAIL;
        setIsAdmin(adminCheck);

        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
            if (!adminCheck) {
              updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(err => console.log("Failed to update lastSeen"));
            }
          } else {
             // If user exists in auth but not in DB (e.g., first time admin login), create a profile.
             if (adminCheck) {
                 const name = firebaseUser.displayName || 'Admin';
                 const email = firebaseUser.email || '';
                 updateUserProfile(firebaseUser.uid, { name, email, isAgent: true });
             } else {
                // This case is for a regular user who is authenticated but has no profile.
                // It's handled by the redirect logic below, which sends them to /profile/create
                setUserProfile(null);
             }
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setLoading(false);
        });
        
        return () => unsubscribeProfile();

      } else {
        // No user is signed in
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (loading) return; // Wait until authentication state is resolved

    const isAuthRoute = ['/landing', '/login', '/signup'].includes(pathname)
    const isAdminRoute = pathname.startsWith('/admin');

    if (!user) {
      // User not logged in, redirect to landing unless it's a public policy page.
      if (!isAuthRoute && !pathname.startsWith('/terms') && !pathname.startsWith('/privacy') && !pathname.startsWith('/refund') && !pathname.startsWith('/gst')) {
        router.replace('/landing');
      }
    } else {
      // User is logged in
      if (isAdmin) {
        if (!isAdminRoute) {
          router.replace('/admin/dashboard');
        }
      } else {
        // Regular user logic
        if (isAdminRoute) { // Don't allow regular users in admin area
          router.replace('/home');
        } else if (isAuthRoute) { // If logged in and on an auth page, go home
          router.replace('/home');
        } else if (!userProfile && pathname !== '/profile/create') {
            // This is a crucial fix: if a user is logged in but has no profile,
            // they must be redirected to create one.
            router.replace('/profile/create');
        }
      }
    }
  }, [user, userProfile, isAdmin, loading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    router.replace('/landing');
  };

  if (loading) {
      return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout, isAdmin }}>
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
