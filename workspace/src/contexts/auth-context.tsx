
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from '@/firebase/config';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { UserProfile } from '@/models/user.model';
import { Loader2 } from 'lucide-react';
import SharedLayout from '@/app/shared-layout';

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
      setLoading(true);
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
             // User is authenticated, but no profile exists. This can happen briefly during signup.
             // The login/signup flow is responsible for creating the profile.
             // We set profile to null here and let other logic handle it.
             setUserProfile(null);
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

    const isAuthRoute = pathname === '/login';
    const isAdminRoute = pathname.startsWith('/admin');

    if (!user) {
      // User is not logged in.
      // If not on the login page, redirect there.
      if (!isAuthRoute) {
        router.replace('/login');
      }
    } else {
      // User is logged in.
      if (isAdmin) {
        // User is an admin.
        // If not on an admin route, redirect to the dashboard.
        if (!isAdminRoute) {
          router.replace('/admin/dashboard');
        }
      } else {
        // User is a regular user.
        // If they are on an admin route, redirect to home.
        if (isAdminRoute) {
          router.replace('/');
        }
        // If they are on the login page, redirect to home.
        else if (isAuthRoute) {
          router.replace('/');
        }
      }
    }
  }, [user, isAdmin, loading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
    router.replace('/login');
  };

  const value = { user, userProfile, loading, logout, isAdmin };
  
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
        <span className="text-4xl font-bold mb-4 text-primary">SZ LUDO</span>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your experience...</p>
      </div>
    );
  }

  // Determine what to render based on the route and auth state
  const isLoginPage = pathname === '/login';
  const isAdminPage = pathname.startsWith('/admin');
  
  let contentToRender;
  if (!user) {
      // If no user, only render login page. Redirect handles other cases.
      contentToRender = isLoginPage ? children : null;
  } else {
      // User is logged in
      if (isAdmin) {
          contentToRender = isAdminPage ? children : null; // Show admin content, or null during redirect
      } else {
          contentToRender = !isAdminPage ? <SharedLayout>{children}</SharedLayout> : null; // Show user layout, or null during redirect
      }
  }


  return (
    <AuthContext.Provider value={value}>
      {contentToRender}
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
