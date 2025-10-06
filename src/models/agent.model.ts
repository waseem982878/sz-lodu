export interface Agent {
  id: string;
  name: string;
  email: string;
  floatBalance: number;
  usedAmount: number;
  remainingBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}