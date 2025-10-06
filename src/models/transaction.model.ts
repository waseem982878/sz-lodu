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
  createdAt: Date;
  completedAt?: Date;
  transactionId?: string;
  paymentMethod?: string;
  bankAccount?: string;
  ifscCode?: string;
}