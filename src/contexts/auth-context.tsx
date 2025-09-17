
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
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      setUserProfile(null); // Reset profile on auth change
      
      if (firebaseUser) {
        setUser(firebaseUser);
        const superAdminCheck = firebaseUser.email === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(superAdminCheck);

        // Super Admin specific logic
        if (superAdminCheck) {
            setIsAgent(true); // Super admin is also an agent
            getDoc(doc(db, 'agents', firebaseUser.uid)).then(agentSnap => {
                if (!agentSnap.exists()) {
                    createAgentProfile(firebaseUser.uid, firebaseUser.email!, "Super Admin");
                }
            });
             setLoading(false); // For admins, we can load faster
             return; 
        }
        
        // Agent check
        const agentQuery = query(collection(db, "agents"), where("email", "==", firebaseUser.email));
        getDocs(agentQuery).then(snapshot => {
            const isAgentProfile = !snapshot.empty;
            setIsAgent(isAgentProfile);
            if (isAgentProfile) {
                setLoading(false); // Agents can also load faster
            } else {
                 // If not an agent, listen for user profile
                 const userRef = doc(db, 'users', firebaseUser.uid);
                 const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
                   if (docSnap.exists()) {
                     setUserProfile(docSnap.data() as UserProfile);
                     updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(() => {});
                   } else {
                      setUserProfile(null);
                   }
                   setLoading(false);
                 }, () => {
                   setUserProfile(null);
                   setLoading(false);
                 });
                 return () => unsubscribeProfile();
            }
        });
      } else {
        // No user is signed in
        setUser(null);
        setIsSuperAdmin(false);
        setIsAgent(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublicRoute = ['/landing', '/login', '/terms', '/privacy', '/refund', '/gst', '/'].includes(pathname);
    const isAdminRoute = pathname.startsWith('/admin');

    if (!user) { // User NOT logged in
        if (!isPublicRoute) {
            router.replace('/login');
        }
    } else { // User IS logged in
        if (isSuperAdmin || isAgent) {
            if (!isAdminRoute) {
                router.replace('/admin/dashboard');
            }
        } else { // Regular user
             if (isAdminRoute) {
                router.replace('/home');
             } else if (isPublicRoute || !userProfile) {
                 // If on a public route, or if profile is still loading, go to home
                 if (pathname !== '/home' && userProfile) {
                    router.replace('/home');
                 }
             }
        }
    }
  }, [user, userProfile, isSuperAdmin, isAgent, loading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    // State will be cleared by the onAuthStateChanged listener
    router.replace('/login');
  };
  
  const value = { user, userProfile, loading, logout, isSuperAdmin, isAgent };
  
  const renderContent = () => {
    if (loading) {
        return <GlobalLoader />;
    }

    const isPublicRoute = ['/landing', '/login', '/terms', '/privacy', '/refund', '/gst', '/'].includes(pathname);
    const isAdminArea = pathname.startsWith('/admin');
    
    if (!user) {
        return isPublicRoute ? children : <GlobalLoader />;
    }
    
    // User is logged in
    if (isSuperAdmin || isAgent) {
        return isAdminArea ? children : <GlobalLoader />;
    }

    // Regular user is logged in. Show loader until profile is available.
    if (!userProfile) {
        return <GlobalLoader />;
    }
    
    // Regular user with profile, show layout for non-admin pages
    return isAdminArea ? <GlobalLoader /> : <SharedLayout>{children}</SharedLayout>;
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

    