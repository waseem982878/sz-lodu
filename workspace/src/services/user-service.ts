
import { db } from '@/firebase/config';
import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit, addDoc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/models/user.model';

// Create or update user profile in Firestore
export const createUserProfile = async (user: User, name: string, phoneNumber: string, referralCode?: string) => {
    const userRef = doc(db, 'users', user.uid);
    
    const referralCodeForNewUser = `SZLUDO${user.uid.substring(0, 6).toUpperCase()}`;
    
    // Base user profile data
    const userProfileData: Omit<UserProfile, 'uid'> & { [key: string]: any } = {
        name: name,
        email: user.email,
        phoneNumber: phoneNumber,
        avatarUrl: user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
        referralCode: referralCodeForNewUser,
        depositBalance: 0,
        winningsBalance: 0,
        kycStatus: 'Not Verified',
        gamesPlayed: 0,
        gamesWon: 0,
        penaltyTotal: 0,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
    };

    // Handle referral if code is provided
    if (referralCode) {
        const q = query(collection(db, 'users'), where('referralCode', '==', referralCode.trim().toUpperCase()), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const referrerDoc = querySnapshot.docs[0];
            userProfileData.referredBy = referrerDoc.id;

            // Create a record in the referrals collection
            await addDoc(collection(db, 'referrals'), {
                referrerId: referrerDoc.id,
                referredId: user.uid,
                referredName: name,
                status: 'pending', // Becomes 'completed' after first game
                createdAt: serverTimestamp()
            });
             console.log(`Referral link created for ${user.uid} by ${referrerDoc.id}`);
        } else {
            console.warn(`Referral code ${referralCode} not found.`);
        }
    }

    // Use setDoc with merge:true to create or overwrite the document.
    // This solves the race condition where an incomplete profile might be created first.
    await setDoc(userRef, userProfileData, { merge: true });
    console.log("User profile successfully created/updated for:", user.uid);
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
};

export const submitKycDetails = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        ...data,
        kycStatus: 'Pending', // Set status to pending on submission
    });
}
