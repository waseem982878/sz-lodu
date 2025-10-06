import { Timestamp } from 'firebase/firestore';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'battle-fee' | 'battle-win';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  description?: string;
}
