
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
  loading: boolean; // This now means profile is loading, not auth
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
  const [authLoading, setAuthLoading] = useState(true); // For initial auth check
  const [profileLoading, setProfileLoading] = useState(true); // For profile data
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        const superAdminCheck = firebaseUser.email === SUPER_ADMIN_EMAIL;
        setIsSuperAdmin(superAdminCheck);
        
        // Check if the user is an agent
        const agentQuery = query(collection(db, "agents"), where("email", "==", firebaseUser.email));
        const unsubscribeAgent = onSnapshot(agentQuery, (snapshot) => {
          setIsAgent(!snapshot.empty);
        });

        // Setup profile listener for regular users
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          setProfileLoading(true);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
             setUserProfile(null);
          }
          setProfileLoading(false);
        }, (error) => {
          setUserProfile(null);
          setProfileLoading(false);
        });

        // If super admin, ensure agent profile exists for them
        if (superAdminCheck) {
            getDoc(doc(db, 'agents', firebaseUser.uid)).then(agentSnap => {
                if (!agentSnap.exists()) {
                    createAgentProfile(firebaseUser.uid, firebaseUser.email!, "Super Admin");
                }
            });
        }
        
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
    if (user) {
        if (!isSuperAdmin && !isAgent) { // Don't track last seen for admins/agents
            const userRef = doc(db, 'users', user.uid);
            updateDoc(userRef, { lastSeen: serverTimestamp() }).catch(err => {});
        }
    }
  }, [pathname, user, isSuperAdmin, isAgent]);

  useEffect(() => {
    if (authLoading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/landing';
    const isRootRoute = pathname === '/';
    const isAdminRoute = pathname.startsWith('/admin');
    const isPolicyRoute = ['/terms', '/privacy', '/refund', '/gst'].includes(pathname);
    
    // Allow policy pages to be viewed by anyone
    if (isPolicyRoute) {
        return;
    }

    // If checking is in progress, or on the root page (which handles its own redirect), do nothing.
    if (isRootRoute) {
        return;
    }

    if (!user) {
      if (!isAuthRoute) {
        router.replace('/');
      }
    } else {
        if (!profileLoading && !userProfile && isAuthRoute) {
            return; 
        }

        if (isSuperAdmin || isAgent) {
            if (!isAdminRoute) {
                router.replace('/admin/dashboard');
            }
        } else {
            if (isAdminRoute) {
                router.replace('/home'); // Redirect regular users from admin to home
            } else if (isAuthRoute) {
                // For regular users, the main app content is now inside /home
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
      } catch (error) {
      }
    }
    await signOut(auth);
    router.replace('/');
  };
  
  const value = { user, userProfile, loading: profileLoading, logout, isSuperAdmin, isAgent };
  
  const renderContent = () => {
    const isAuthPage = pathname === '/login' || pathname === '/landing' || pathname === '/';
    const isAdminPage = pathname.startsWith('/admin');
    const isPolicyPage = ['/terms', '/privacy', '/refund', '/gst'].includes(pathname);

    // Always render policy pages without layout
    if(isPolicyPage) {
        return children;
    }

    if (authLoading && !user) {
      return <GlobalLoader />;
    }
    
    if (isAuthPage) {
        return children;
    }
    
    if (!user) {
      return <GlobalLoader />;
    }
    
    if (isSuperAdmin || isAgent) {
        return isAdminPage ? children : <GlobalLoader />;
    } 
    
    if (!profileLoading && !userProfile && !isAuthPage) {
        return <GlobalLoader />;
    }

    if(isAdminPage) return <GlobalLoader/>;
    
    // All regular user authenticated routes are wrapped in SharedLayout
    return <SharedLayout>{children}</SharedLayout>;
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

    