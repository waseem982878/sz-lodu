export interface UpiPayment {
  id: string;
  payeeName: string;
  upiId: string;
  isActive: boolean;
  dailyLimit: number;
  currentReceived: number;
  createdAt: Date;
  updatedAt: Date;
}
