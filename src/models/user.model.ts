export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  balance: number;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin' | 'agent';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
