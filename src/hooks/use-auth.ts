import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/models/user.model';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            setUser(user);
            if (user) {
                // Fetch user profile from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data() as UserProfile);
                } else {
                    // Handle case where user exists in Auth but not in Firestore
                    // You might want to create a new user profile here
                    const newUserProfile: UserProfile = {
                        uid: user.uid,
                        email: user.email,
                        role: 'user',
                        walletBalance: 0,
                        kycStatus: 'not_started',
                    };
                    setUserProfile(newUserProfile);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, userProfile, loading };
};
