
import type { Timestamp } from "firebase/firestore";

export interface Transaction {
    id: string;
    userId: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    bonusAmount?: number; // For GST bonus on deposit
    status: 'pending' | 'completed' | 'rejected';
    
    // Stripe specific fields
    stripeCheckoutSessionId?: string;
    stripePaymentIntentId?: string;

    // Manual deposit fields (deprecated but kept for history)
    screenshotUrl?: string; // For deposits
    upiId?: string; // To track which UPI ID was used for the deposit
    
    withdrawalDetails?: {
        method: 'upi' | 'bank';
        address: string; // UPI ID or bank details string
    };
    createdAt: any;
    updatedAt: any;
    notes?: string; // Admin notes
    processedBy?: { // To track which agent handled the transaction
        id: string;
        name: string;
    };
    paymentSent?: boolean; // For withdrawals, to confirm payment has been sent by agent
    isRead?: boolean; // For notification system
}
