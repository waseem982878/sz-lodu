import { UserProfile } from './user.model';

export interface Agent extends UserProfile {
  id: string;
  assignedUsers: string[]; // Array of user UIDs
  commissionRate: number; // Percentage
  floatBalance: number;
  usedAmount: number;
  isActive: boolean;
  remainingBalance: number;
}
