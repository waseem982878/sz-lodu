export interface UpiPayment {
  id: string;
  name: string;       // e.g., "Primary UPI", "Google Pay"
  upiId: string;      // The actual VPA, e.g., user@oksbi
  isEnabled: boolean; // To allow admins to toggle it on/off
  createdAt: Date;
  updatedAt: Date;
}
