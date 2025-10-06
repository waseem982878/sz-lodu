import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from '@/models/order.model';

class OrderService {
  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    try {
      const orderCollection = collection(db, 'orders');
      const docRef = await addDoc(orderCollection, {
        ...order,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

}

export default new OrderService();
