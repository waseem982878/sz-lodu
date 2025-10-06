export interface PaymentUpi {
  id: string;
  upiId: string;
  payeeName: string;
  dailyLimit: number;
  currentReceived: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRequest {
  id: string;
  orderId: string;
  amount: number;
  upiId: string;
  payeeName: string;
  payerName?: string;
  payerUpi?: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  description?: string;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  transactionId?: string;
  screenshotUrl?: string;
}