export interface Agent {
  id: string;         // Corresponds to the User UID
  name: string;
  email: string;

  // Commission and earnings
  commissionRate: number; // e.g., 0.02 for 2%
  totalCommissionEarned: number;
  unpaidCommission: number;

  // Player management
  referredPlayerCount: number;
  totalPlayerWagered: number; // Total amount wagered by their referred players

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
