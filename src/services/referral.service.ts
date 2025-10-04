import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/models/user.model'; // Assuming you have this model

// Finds a user by their unique referral code
export const getReferrer = async (referralCode: string): Promise<User | null> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referralCode', '==', referralCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
};

// Creates a record of a referral
export const createReferral = async (referrerId: string, newUserId: string): Promise<void> => {
    const referralsRef = collection(db, 'referrals');
    await addDoc(referralsRef, {
        referrerId, // ID of the person who referred
        newUserId,    // ID of the new user who was referred
        createdAt: serverTimestamp(),
        status: 'pending', // Could be updated to 'completed' after the new user makes a deposit
    });
};
