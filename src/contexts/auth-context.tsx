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
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
            // Check for admin status from the profile
            setIsAdmin(!!profile.isAdmin); 
          } else {
             setUserProfile(null);
             setIsAdmin(false);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setIsAdmin(false);
          setLoading(false);
        });
        
        return () => unsubscribeProfile();

      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (loading) return; 

    const isAuthRoute = ['/login', '/signup/profile'].some(p => pathname.startsWith(p));
    const isAdminRoute = pathname.startsWith('/admin');

    if (!user) {
        // User is not logged in
         const isPublicRoute = ['/landing', '/terms', '/privacy', '/refund', '/gst'].some(p => pathname.startsWith(p));
        if (!isPublicRoute && !isAuthRoute) {
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
            if (isAdminRoute) {
                router.replace('/home'); // Non-admin on admin route
            } else if (!userProfile && pathname !== '/signup/profile') {
                router.replace('/signup/profile'); // Profile doesn't exist, force creation
            } else if (userProfile && isAuthRoute) {
                router.replace('/home'); // Profile exists, but user is on login/signup page
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
