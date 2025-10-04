// src/services/user-service.ts
import { db } from './firebase-service';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  depositBalance: number;
  winningsBalance: number;
  gamesPlayed: number;
  gamesWon: number;
  winStreak: number;
  losingStreak: number;
  biggestWin: number;
  createdAt: any;
  updatedAt: any;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  kycDocuments?: {
    documentType: string;
    frontImage: string;
    backImage: string;
  };
}

export const createUserProfile = async (user: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};
