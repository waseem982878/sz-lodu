export interface PaymentUpi {
    id: string;
    upiId: string;
    payeeName: string;
    dailyLimit: number;
    currentReceived: number;
    isActive: boolean;
}
