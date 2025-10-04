export interface PaymentUpi {
  id: string;
  upiId: string;
  payeeName: string;
  dailyLimit: number;
  currentReceived: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface PaymentRequest {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  upiId: string;
  payeeName: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  description?: string;
  transactionId?: string;
  createdAt: any;
  updatedAt?: any;
  expiresAt: any;
  completedAt?: any;
}