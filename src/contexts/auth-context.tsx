
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from '@/firebase/config';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { UserProfile } from '@/models/user.model';
import { Loader2 } from 'lucide-react';

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
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Don't set loading to true here, only at the start
      if (firebaseUser) {
        setUser(firebaseUser);
        
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
            setIsAdmin(!!profile.isAdmin); 
          } else {
             setUserProfile(null);
             setIsAdmin(false);
          }
          setLoading(false); // Set loading to false after profile is fetched (or not found)
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setIsAdmin(false);
          setLoading(false); // Also set loading to false on error
        });
        
        return () => unsubscribeProfile();

      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false); // Set loading to false if no user
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (loading) return; 

    const publicRoutes = ['/landing', '/terms', '/privacy', '/refund', '/gst'];
    const authRoutes = ['/login', '/signup/profile'];

    // 1. User is NOT logged in
    if (!user) {
        const isPublicRoute = publicRoutes.some(p => pathname.startsWith(p));
        const isAuthRoute = authRoutes.some(p => pathname.startsWith(p));
        // If the user is not on a public or auth route, and not on the root page (which handles its own redirect), force them to the landing page.
        if (!isPublicRoute && !isAuthRoute && pathname !== '/') {
            router.replace('/landing');
        }
        return;
    }

    // 2. User IS logged in
    // If a logged-in user is on a public page (like landing) or an auth page (like login), redirect them to their appropriate dashboard.
    const onPublicOrAuthRoute = publicRoutes.some(p => pathname.startsWith(p)) || authRoutes.some(p => pathname.startsWith(p)) || pathname === '/';
    if (onPublicOrAuthRoute) {
        if (isAdmin) {
            router.replace('/admin/dashboard');
        } else if (userProfile) {
            router.replace('/home');
        } else {
            // This case handles the moment after signup but before profile creation is complete.
            router.replace('/signup/profile');
        }
        return;
    }

    // 3. User is logged in and on a private route. Check for role mismatches.
    const isAdminRoute = pathname.startsWith('/admin');
    
    if (isAdmin && !isAdminRoute) {
       // An admin is on a user page. This is now ALLOWED. No forced redirect.
    } else if (!isAdmin && isAdminRoute) {
        // A non-admin is trying to access an admin route. Redirect them to the user home.
        router.replace('/home');
    } else if (user && !userProfile && pathname !== '/signup/profile') {
        // A user is logged in, but has no profile, and is not on the profile creation page. Force them there.
        router.replace('/signup/profile');
    }

  }, [user, userProfile, isAdmin, loading, pathname, router]);

  const logout = async () => {
    if (user) {
       // Only update lastSeen if there is a user.
       await updateDoc(doc(db, 'users', user.uid), { lastSeen: serverTimestamp() }).catch(err => console.log("Failed to update lastSeen on logout"));
    }
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
