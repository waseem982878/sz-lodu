import { Timestamp } from 'firebase/firestore';

export interface UpiPayment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentUpi {
    id: string;
    upiId: string;
    payeeName: string;
    dailyLimit: number;
    currentReceived: number;
    isActive: boolean;
}
