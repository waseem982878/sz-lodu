
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { UserProfile } from "@/models/user.model";

/**
 * Creates or updates a user profile in Firestore.
 * This is the primary function for managing user data upon login or changes.
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
    
    // Default values for a new user, merged with any provided data
    const defaults = {
        uid: userId,
        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(data.name || 'User')}`,
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

    const profileData = {
        ...defaults,
        ...data,
    };

    // Use setDoc with merge:true to create or update the document without overwriting existing fields.
    return setDoc(userRef, profileData, { merge: true });
};


/**
 * Creates an agent profile in Firestore and marks the user as an agent.
 * This should be used for trusted users, as it grants agent privileges.
 * @param userId The user's ID.
 * @param email The user's email.
 * @param displayName The user's display name.
 * @returns A promise that resolves when the agent profile is created.
 */
export async function createAgentProfile(userId: string, email: string, displayName: string): Promise<void> {
  if (!db) {
    console.error("Database not available. Cannot create agent profile.");
    return;
  }
  const userRef = doc(db, "users", userId);
  // This will create or update the user document with agent status
  return updateUserProfile(userId, {
      name: displayName,
      email: email,
      isAgent: true,
  });
}

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
