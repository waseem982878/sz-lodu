import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/models/notification.model'; // You need to create this model

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
        notificationsRef, 
        where('userId', '==', userId), 
        orderBy('createdAt', 'desc'),
        limit(50) // Get the 50 most recent notifications
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return [];
    }

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};
