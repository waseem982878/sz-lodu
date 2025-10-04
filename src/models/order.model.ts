export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentRequestId?: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
