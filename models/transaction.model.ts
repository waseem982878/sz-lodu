export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  upiId?: string;
  screenshotUrl?: string;
  adminNotes?: string;
  createdAt: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp
  transactionId?: string;
}
