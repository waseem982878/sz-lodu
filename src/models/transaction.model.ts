export type TransactionType = 'deposit' | 'withdrawal' | 'battle_win' | 'battle_fee' | 'penalty';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: Date;
  updatedAt: Date;
  orderId?: string; // For deposits, links to an order
  battleId?: string; // For battle-related transactions
}
