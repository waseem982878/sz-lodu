import { UserProfile } from './user.model';

export interface Agent extends UserProfile {
  assignedUsers: string[]; // Array of user UIDs
  commissionRate: number; // Percentage
}
