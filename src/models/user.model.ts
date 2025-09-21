
import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    avatarUrl: string;
    referralCode: string;
    referredBy?: string; // UID of the user who referred them
    depositBalance: number;
    winningsBalance: number;
    kycStatus: 'Not Verified' | 'Pending' | 'Verified' | 'Rejected';
    gamesPlayed: number;
    gamesWon: number;
    penaltyTotal: number;
    createdAt: any;
    lastSeen?: any; // For user analytics
    
    // Detailed Stats
    winStreak: number;
    losingStreak: number;
    biggestWin: number;
    
    // KYC Details
    panNumber?: string;
    aadhaarNumber?: string;
    dob?: string; // Date of Birth
    upiId?: string; // For withdrawals
    panCardUrl?: string;
    aadhaarCardUrl?: string;
    kycNotes?: string; // Notes from admin on rejection

    // Role management
    isAgent?: boolean;
}
