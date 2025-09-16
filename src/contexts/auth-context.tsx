
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from '@/firebase/config';
import { doc, onSnapshot, serverTimestamp, updateDoc, getDoc, query, where, collection } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import type { UserProfile } from '@/models/user.model';
import { Loader2 } from 'lucide-react';
import { createAgentProfile } from '@/services/user-agent-service';
import SharedLayout from '@/app/shared-layout';

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
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const superAdminCheck = firebaseUser.email === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(superAdminCheck);
        
        const agentQuery = query(collection(db, "agents"), where("email", "==", firebaseUser.email));
        const unsubscribeAgent = onSnapshot(agentQuery, (snapshot) => {
          setIsAgent(!snapshot.empty);
        });

        if (superAdminCheck) {
            getDoc(doc(db, 'agents', firebaseUser.uid)).then(agentSnap => {
                if (!agentSnap.exists()) {
                    createAgentProfile(firebaseUser.uid, firebaseUser.email!, "Super Admin");
                }
            });
        }
        
        // Setup profile listener for regular users
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
             // Profile doesn't exist yet (e.g., during signup).
             // Set it to null and let the logic wait for it to be created.
             setUserProfile(null);
          }
          setProfileLoading(false);
        }, (error) => {
          setUserProfile(null);
          setProfileLoading(false);
        });
        
        setAuthLoading(false);
        return () => {
            unsubscribeProfile();
            unsubscribeAgent();
        };
      } else {
        setUser(null);
        setUserProfile(null);
        setIsSuperAdmin(false);
        setIsAgent(false);
        setAuthLoading(false);
        setProfileLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    if (user && !isSuperAdmin && !isAgent && pathname !== '/login') {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(err => {});
    }
  }, [pathname, user, isSuperAdmin, isAgent]);

  useEffect(() => {
    if (authLoading) return;

    const isPublicRoute = ['/landing', '/login', '/terms', '/privacy', '/refund', '/gst', '/'].includes(pathname);
    const isAdminRoute = pathname.startsWith('/admin');

    if (!user) { // User is not logged in
        if (!isPublicRoute) {
            router.replace('/login');
        }
    } else { // User is logged in
        if (isSuperAdmin || isAgent) {
            if (!isAdminRoute) {
                router.replace('/admin/dashboard');
            }
        } else { // Regular user
            // Profile is still loading or doesn't exist yet, wait.
            if (profileLoading || !userProfile) {
                return;
            }
             if (isAdminRoute) {
                router.replace('/home');
             } else if (isPublicRoute) {
                router.replace('/home');
             }
        }
    }
  }, [user, userProfile, isSuperAdmin, isAgent, authLoading, profileLoading, pathname, router]);

  const logout = async () => {
    if (user && !isSuperAdmin && !isAgent) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { lastSeen: serverTimestamp() });
      } catch (error) {}
    }
    await signOut(auth);
    router.replace('/login');
  };
  
  const value = { user, userProfile, loading: authLoading || profileLoading, logout, isSuperAdmin, isAgent };
  
  const renderContent = () => {
    const isPublicRoute = ['/landing', '/login', '/terms', '/privacy', '/refund', '/gst', '/'].includes(pathname);
    const isAdminPage = pathname.startsWith('/admin');

    // Show a global loader if we're doing auth checks, or for a regular user if their profile isn't loaded yet.
    // But don't show the loader on public pages to avoid flash of content.
    if ((authLoading || (user && !isAgent && !isSuperAdmin && profileLoading))) {
        if (!isPublicRoute) return <GlobalLoader />;
    }

    // For a logged-out user, only show public pages. The useEffect handles the redirect.
    if (!user) {
        return isPublicRoute ? children : <GlobalLoader />;
    }

    // For a logged-in user (admin or regular)
    if (isSuperAdmin || isAgent) {
        return isAdminPage ? children : <GlobalLoader />; // Show admin page or loader while redirecting
    }
    
    // For a regular user, show the shared layout for non-admin pages.
    // If they land on a public page, the useEffect will redirect them.
    if (userProfile) {
        if (isAdminPage) return <GlobalLoader />;
        return isPublicRoute ? <GlobalLoader /> : <SharedLayout>{children}</SharedLayout>;
    }
    
    // Fallback for user logged in but profile not yet available (e.g. during signup)
    return <GlobalLoader />;
  }

  return (
    <AuthContext.Provider value={value}>
      {renderContent()}
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
