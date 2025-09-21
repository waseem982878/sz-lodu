
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
  
  const protectedRoutes = ['/home', '/profile', '/wallet', '/play', '/create', '/game', '/refer', '/leaderboard', '/support'];
  const publicRoutes = ['/landing', '/login', '/terms', '/privacy', '/refund', '/gst', '/'];
  const adminRoutes = ['/admin'];


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const superAdminCheck = firebaseUser.email === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(superAdminCheck);

        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
            setIsAgent(!!profile.isAgent || superAdminCheck);
            updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {});
            setLoading(false);
          } else {
             if (superAdminCheck) {
               createAgentProfile(firebaseUser.uid, firebaseUser.email!, "Super Admin").catch(console.error);
             } else {
                setUserProfile(null); // Let's signup flow create it
                setLoading(false);
             }
          }
        }, (error) => {
          console.error("Auth context profile listener error:", error);
          setUserProfile(null);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
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
    if (loading) return;

    const isPublic = publicRoutes.some(route => pathname === route);
    const isAdminPath = pathname.startsWith('/admin');

    if (!user) { // Not logged in
        if (!isPublic) {
            router.replace('/landing');
        }
    } else { // Logged in
        if (isAgent || isSuperAdmin) {
            if (!isAdminPath) {
                router.replace('/admin/dashboard');
            }
        } else { // Regular user
            if (isAdminPath) {
                router.replace('/home');
            } else if (isPublic) {
                router.replace('/home');
            }
        }
    }
  }, [user, userProfile, isAgent, isSuperAdmin, loading, pathname, router]);
  
  const logout = async () => {
    await signOut(auth);
  };
  
  const value = { user, userProfile, loading, logout, isSuperAdmin, isAgent };
  
  // Render children immediately if not in a loading state. The useEffect hook will handle redirection.
  // This prevents the white screen of death by always rendering something.
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
