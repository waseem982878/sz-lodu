
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
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
  
  const publicRoutes = ['/landing', '/login', '/terms', '/privacy', '/refund', '/gst', '/'];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const superAdminCheck = firebaseUser.email === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(superAdminCheck);

        // Listen to the user's profile document in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
            // The isAgent role is now directly on the user's profile.
            // This avoids a separate, permission-failing query to the 'agents' collection.
            setIsAgent(!!profile.isAgent || superAdminCheck);
            updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {});
          } else {
            // Profile doesn't exist. This could be a new user or an admin logging in for the first time.
            if (superAdminCheck) {
              // If super admin has no user profile, create one.
               createAgentProfile(firebaseUser.uid, firebaseUser.email!, "Super Admin").then(() => {
                    // The profile will be picked up by the onSnapshot listener, no need to set state here.
               });
            } else {
                 setUserProfile(null); // Regular user with no profile yet.
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Auth context profile listener error:", error);
          setUserProfile(null);
          setLoading(false);
        });

        // This is a failsafe. If the onAuthStateChanged is called again (e.g., logout),
        // we must clean up the previous user's profile listener.
        return () => unsubscribeProfile();
      } else {
        // No user is signed in
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
    if (loading) return; // Do nothing while loading

    const isPublic = publicRoutes.some(route => pathname === route);
    const isAdminRoute = pathname.startsWith('/admin');

    if (user && userProfile) {
      // User is logged in and has a profile
      if (isAgent || isSuperAdmin) {
        if (!isAdminRoute) router.replace('/admin/dashboard');
      } else { // Regular user
        if (isAdminRoute) router.replace('/home');
        else if (isPublic) router.replace('/home');
      }
    } else if (user && !userProfile) {
        // User is logged in but profile is being created. Stay on loading screen (or login page).
        if(pathname !== '/login') {
            // Don't redirect from login page while profile is being created.
        }
    } else {
      // User is not logged in
      if (!isPublic) router.replace('/landing');
    }
  }, [user, userProfile, isAgent, isSuperAdmin, loading, pathname, router]);
  
  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle the state reset and redirection
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
