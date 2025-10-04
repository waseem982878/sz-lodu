import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Order {
    id: string;
    userId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    paymentGateway: string;
    gatewayOrderId?: string;
    createdAt: any; // Firestore ServerTimestamp
    updatedAt: any; // Firestore ServerTimestamp
}

const ordersCollection = collection(db, 'orders');

export const createOrder = async (userId: string, amount: number, paymentGateway: string): Promise<Order> => {
    const newOrder = {
        userId,
        amount,
        paymentGateway,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(ordersCollection, newOrder);
    return { id: docRef.id, ...newOrder } as Order;
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
    }
    return null;
};

export const updateOrderStatus = async (orderId: string, status: 'completed' | 'failed', gatewayOrderId?: string) => {
    const orderRef = doc(db, 'orders', orderId);
    const updates: any = {
        status,
        updatedAt: serverTimestamp(),
    };
    if (gatewayOrderId) {
        updates.gatewayOrderId = gatewayOrderId;
    }
    await updateDoc(orderRef, updates);
};
