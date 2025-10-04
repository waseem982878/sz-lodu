import { Timestamp } from 'firebase/firestore';

export interface Transaction {
    id: string;
    userId: string;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Timestamp;
}
