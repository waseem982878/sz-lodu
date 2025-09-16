
import { db } from '@/firebase/config';
import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit, addDoc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/models/user.model';
import type { Agent } from '@/models/agent.model';

// Create or update user profile in Firestore
export const createUserProfile = async (user: User, name: string, phoneNumber: string | null, referralCode?: string) => {
    const userRef = doc(db, 'users', user.uid);
    
    const docSnap = await getDoc(userRef);
    // If profile exists, it might be a re-authentication, do nothing to avoid overwriting.
    if (docSnap.exists()) {
        return;
    }

    const referralCodeForNewUser = `SZLUDO${user.uid.substring(0, 6).toUpperCase()}`;
    
    const userProfileData: Omit<UserProfile, 'uid'> = {
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
        winStreak: 0,
        losingStreak: 0,
        biggestWin: 0,
        createdAt: serverTimestamp() as any,
        lastSeen: serverTimestamp() as any,
    };

    if (referralCode) {
        const q = query(collection(db, 'users'), where('referralCode', '==', referralCode.trim().toUpperCase()), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const referrerDoc = querySnapshot.docs[0];
            userProfileData.referredBy = referrerDoc.id;

            await addDoc(collection(db, 'referrals'), {
                referrerId: referrerDoc.id,
                referredId: user.uid,
                referredName: name,
                status: 'pending',
                createdAt: serverTimestamp()
            });
        }
    }
    
    // Use setDoc instead of updateDoc to guarantee the document is created.
    // This is crucial for new user sign-ups.
    await setDoc(userRef, userProfileData);
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
};

export const submitKycDetails = async (uid: string, data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        ...data,
        kycStatus: 'Pending',
    });
}

export const updateUserBalances = async (uid: string, depositBalance: number, winningsBalance: number) => {
    if (typeof depositBalance !== 'number' || typeof winningsBalance !== 'number' || depositBalance < 0 || winningsBalance < 0) {
        throw new Error("Invalid balance amounts provided.");
    }
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        depositBalance: depositBalance,
        winningsBalance: winningsBalance,
    });
};

export const createAgentProfile = async (uid: string, email: string, name: string) => {
    const agentRef = doc(db, 'agents', uid);

    const agentProfileData: Omit<Agent, 'id' | 'remainingBalance'> = {
        name: name,
        email: email,
        floatBalance: Infinity, // Super admin has unlimited float
        usedAmount: 0,
        isActive: true,
    };
    
    await setDoc(agentRef, agentProfileData, { merge: true });
};
