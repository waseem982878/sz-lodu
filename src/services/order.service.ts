import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderItem } from '@/models/order.model';

export class OrderService {
  
  static async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    const amount = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const orderNumber = this.generateOrderNumber();

    const order: Omit<Order, 'id'> = {
      orderNumber,
      userId,
      amount,
      status: 'pending',
      items,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'orders'), order);
    return { id: docRef.id, ...order } as Order;
  }

  static async getOrder(id: string): Promise<Order | null> {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  }

  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-6)}-${random}`;
  }
}
