import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;

  // App-specific fields
  username?: string;
  referralCode?: string;
  referredBy?: string;

  // Balance fields
  depositBalance: number;       // Money added by user
  winningsBalance: number;      // Money won from games
  bonusBalance: number;         // Bonus cash from promos

  // Gameplay stats
  totalGamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
  totalDeposits: number;
  totalWithdrawals: number;

  // Timestamps
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  lastLogin?: Timestamp | Date;
  
  // Other info
  isAgent?: boolean;
  isAdmin?: boolean;
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
  };
}
