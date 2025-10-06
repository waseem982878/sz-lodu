import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/models/user.model'; 

interface AuthState {
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile | null; // Your custom user data
  loading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({ 
    firebaseUser: null,
    currentUser: null,
    loading: true,
    error: null, 
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthState(prev => ({ ...prev, firebaseUser: user, loading: true }));
        
        // Now, listen for changes to the user's document in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setAuthState(prev => ({ 
              ...prev, 
              currentUser: { uid: doc.id, ...doc.data() } as UserProfile,
              loading: false 
            }));
          } else {
            // This case can happen if a user is authenticated but doesn't have a Firestore document yet.
            // You might want to create one here.
            setAuthState(prev => ({ ...prev, currentUser: null, loading: false }));
          }
        }, (error) => {
          console.error("Error fetching user data:", error);
          setAuthState(prev => ({ ...prev, error, loading: false }));
        });

        return () => unsubscribeSnapshot(); // Unsubscribe from Firestore listener on cleanup

      } else {
        // User is signed out
        setAuthState({ firebaseUser: null, currentUser: null, loading: false, error: null });
      }
    }, (error) => {
      console.error("Auth state error:", error);
      setAuthState(prev => ({ ...prev, error, loading: false }));
    });

    return () => unsubscribeAuth(); // Unsubscribe from auth listener on cleanup
  }, []);

  return authState;
}
