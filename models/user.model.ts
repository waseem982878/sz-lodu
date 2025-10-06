import { Timestamp } from 'firebase/firestore';

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    phoneNumber: string | null;
    createdAt: Timestamp;
    lastLoginAt: Timestamp;
}

export interface UserProfile {
    uid: string;
    name?: string;
    email?: string;
    photoURL?: string;
    phoneNumber?: string;
    isAdmin?: boolean;
    depositBalance?: number;
    winningsBalance?: number;
    createdAt?: Timestamp;
    lastActive?: Timestamp;
    kycStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected' | 'Not Submitted' | 'Pending' | 'Verified' | 'Rejected' | 'approved' | 'none';
    isActive?: boolean;
    blockedAt?: Timestamp;
    gamesPlayed?: number;
    gamesWon?: number;
    winStreak?: number;
    losingStreak?: number;
    biggestWin?: number;
    referralCode?: string;
}
