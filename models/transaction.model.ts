export interface Transaction {
  id: string;
  type: string;
  description?: string;
  amount: number;
  status: string;
}
