export type UserRole = 'user' | 'admin';

export interface UserProfile {
    uid: string;
    email?: string | null;
    name?: string | null;
    photoURL?: string | null;
    role: UserRole;
    walletBalance: number;
    // KYC details
    kycStatus: 'not_started' | 'pending' | 'approved' | 'rejected';
    kycDetails?: {
        documentType: string;
        documentUrl: string;
        submittedAt: any; // Use serverTimestamp
    };
}
