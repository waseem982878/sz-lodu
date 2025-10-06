export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  depositBalance: number;
  winningsBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  kycStatus: 'Pending' | 'Verified' | 'Rejected' | 'Not Submitted';
  aadhaarNumber?: string;
  panNumber?: string;
  dob?: string;
  upiId?: string;
  aadhaarCardUrl?: string;
  panCardUrl?: string;
  isActive: boolean;
  isAgent?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  kycNotes?: string;
}