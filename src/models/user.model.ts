import { Timestamp } from 'firebase/firestore';

export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  phoneNumber?: string;
  depositBalance?: number;
  winningsBalance?: number;
  kycStatus?: KycStatus;
  kycNotes?: string; // For rejection reasons etc.
  aadhaarNumber?: string;
  panNumber?: string;
  aadhaarCardUrl?: string;
  panCardUrl?: string;
  gamesPlayed?: number;
  gamesWon?: number;
  isActive?: boolean;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  dob?: string;
}
