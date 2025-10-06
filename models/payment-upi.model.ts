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
