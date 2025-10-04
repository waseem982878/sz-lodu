import { collection, doc, addDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Basic Order Service Structure
export class OrderService {

    static ordersCollection = collection(db, 'orders');

    static async createOrder(userId: string, items: any[], total: number) {
        const orderData = {
            userId,
            items,
            total,
            status: 'pending',
            createdAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(this.ordersCollection, orderData);
        return { id: docRef.id, ...orderData };
    }

    static async getOrder(orderId: string) {
        const docRef = doc(this.ordersCollection, orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    }

    static async updateOrderStatus(orderId: string, status: string) {
        const docRef = doc(this.ordersCollection, orderId);
        await updateDoc(docRef, { status });
    }
}
