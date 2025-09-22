
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { UserProfile } from "@/models/user.model";
import type { User } from "firebase/auth";

/**
 * Creates a user profile in Firestore after signup.
 * @param user The Firebase user object.
 * @param name The user's chosen display name.
 * @param phoneNumber The user's phone number.
 * @returns A promise that resolves when the profile is created.
 */
export const createUserProfile = async (user: User, name: string, phoneNumber: string): Promise<void> => {
    if (!db) {
        throw new Error("Database not available. Cannot create user profile.");
    }
    const userRef = doc(db, "users", user.uid);
    const referralCode = `SZLUDO${user.uid.substring(0, 6).toUpperCase()}`;

    const profileData: UserProfile = {
        uid: user.uid,
        name,
        email: user.email || null,
        phoneNumber: phoneNumber,
        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
        referralCode: referralCode,
        depositBalance: 0,
        winningsBalance: 0,
        kycStatus: 'Not Verified',
        gamesPlayed: 0,
        gamesWon: 0,
        winStreak: 0,
        losingStreak: 0,
        biggestWin: 0,
        penaltyTotal: 0,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
    };

    return setDoc(userRef, profileData, { merge: true });
};


/**
 * Creates or updates a user profile in Firestore.
 * This is the primary function for managing user data.
 * @param userId The user's ID.
 * @param data The partial user data to create or merge.
 * @returns A promise that resolves when the profile is created or updated.
 */
export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
    if (!db) {
        console.error("Database not available. Cannot update user profile.");
        return;
    }
    const userRef = doc(db, "users", userId);
    
    // Ensure 'updatedAt' is always included
    const profileData = {
        ...data,
        updatedAt: serverTimestamp(),
    };

    return setDoc(userRef, profileData, { merge: true });
};

/**
 * Updates the balances for a specific user. Intended for admin use.
 * @param userId The ID of the user to update.
 * @param depositBalance The new deposit balance.
 * @param winningsBalance The new winnings balance.
 */
export const updateUserBalances = async (userId: string, depositBalance: number, winningsBalance: number) => {
    if (!db) throw new Error("Database not available.");
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        depositBalance: depositBalance,
        winningsBalance: winningsBalance
    });
};

/**
 * Submits KYC details for a user and sets their status to 'Pending'.
 * @param userId The user's ID.
 * @param data The KYC data to submit.
 */
export const submitKycDetails = async (userId: string, data: Partial<UserProfile>) => {
    if (!db) throw new Error("Database not available.");
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        ...data,
        kycStatus: 'Pending',
    });
};
