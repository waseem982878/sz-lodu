"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from '@/firebase/config';
import { doc, onSnapshot, serverTimestamp, updateDoc, query, where, collection, getDocs } from 'firebase/firestore';
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
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const publicRoutes = ['/landing', '/login', '/terms', '/privacy', '/refund', '/gst', '/'];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const superAdminCheck = firebaseUser.email === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(superAdminCheck);

        // Super Admin Path
        if (superAdminCheck) {
          setIsAgent(true);
          getDocs(query(collection(db, 'agents'), where('email', '==', firebaseUser.email))).then(agentSnap => {
            if (agentSnap.empty) {
              createAgentProfile(firebaseUser.uid, firebaseUser.email!, "Super Admin");
            }
            setLoading(false);
          });
          return; // End for super admin
        }

        // Agent/User Path
        const agentQuery = query(collection(db, 'agents'), where('email', '==', firebaseUser.email));
        getDocs(agentQuery).then(agentSnap => {
          const isAgentProfile = !agentSnap.empty;
          setIsAgent(isAgentProfile);

          if (isAgentProfile) {
            setLoading(false); // Agent loading is fast
          } else {
            // Regular user path, set up profile listener
            const userRef = doc(db, 'users', firebaseUser.uid);
            const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
              if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
                updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {});
              } else {
                setUserProfile(null);
              }
              setLoading(false); // Loading is false after profile is fetched or confirmed non-existent
            }, () => {
              setUserProfile(null);
              setLoading(false);
            });
            // This is tricky, but onAuthStateChanged handles cleanup when user logs out.
          }
        });

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

    const isPublic = publicRoutes.includes(pathname);
    const isAdminRoute = pathname.startsWith('/admin');

    if (user) {
      // User is logged in
      const isRoleAgent = isAgent || isSuperAdmin;
      if (isRoleAgent) {
        if (!isAdminRoute) router.replace('/admin/dashboard');
      } else { // Regular user
        if (isAdminRoute) router.replace('/home');
        else if (isPublic && userProfile) router.replace('/home');
      }
    } else {
      // User is not logged in
      if (!isPublic) router.replace('/landing');
    }
  }, [user, userProfile, isAgent, isSuperAdmin, loading, pathname, router, publicRoutes]);
  
  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle the state reset and redirection
  };
  
  const value = { user, userProfile, loading, logout, isSuperAdmin, isAgent };
  
  if (loading) {
    return <GlobalLoader />;
  }

  // Render children immediately after loading, redirection is handled by useEffect
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
