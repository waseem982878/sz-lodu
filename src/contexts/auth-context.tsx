
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from '@/lib/firebase';
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
    // onAuthStateChanged is the listener for auth state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false); // OPTIMIZATION: Stop loading as soon as auth is confirmed.
        
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
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
          setIsAdmin(false);
        });
        
        return () => unsubscribeProfile();

      } else {
        // This block runs when the user is signed out or not logged in.
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (loading) return; 

    const publicRoutes = ['/landing', '/terms', '/privacy', '/refund', '/gst'];
    const authRoutes = ['/login', '/signup/profile'];

    if (!user) {
        const isPublicRoute = publicRoutes.some(p => pathname.startsWith(p));
        const isAuthRoute = authRoutes.some(p => pathname.startsWith(p));
        if (!isPublicRoute && !isAuthRoute && pathname !== '/') {
            router.replace('/landing');
        }
        return;
    }

    const onPublicOrAuthRoute = publicRoutes.some(p => pathname.startsWith(p)) || authRoutes.some(p => pathname.startsWith(p)) || pathname === '/';
    if (onPublicOrAuthRoute) {
        if (isAdmin) {
            router.replace('/admin/dashboard');
        } else if (userProfile) {
            router.replace('/home');
        } else {
            router.replace('/signup/profile');
        }
        return;
    }

    const isAdminRoute = pathname.startsWith('/admin');
    
    if (!isAdmin && isAdminRoute) {
        router.replace('/home');
    } else if (user && !userProfile && pathname !== '/signup/profile') {
        router.replace('/signup/profile');
    }

  }, [user, userProfile, isAdmin, loading, pathname, router]);

  const logout = async () => {
    if (user && auth && db) {
       await updateDoc(doc(db, 'users', user.uid), { lastSeen: serverTimestamp() }).catch(err => console.log("Failed to update lastSeen on logout"));
       await signOut(auth);
    }
    setUser(null);
    setUserProfile(null);
    setIsAdmin(false);
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
