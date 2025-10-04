import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/models/user.model'; // Assuming you have this model

export const updateUserKycStatus = async (userId: string, status: 'pending' | 'approved' | 'rejected', documentUrl?: string) => {
    const userRef = doc(db, 'users', userId);
    const updates: any = {
        kycStatus: status,
        updatedAt: serverTimestamp(),
    };
    if (documentUrl) {
        updates.kycDocumentUrl = documentUrl;
    }
    await updateDoc(userRef, updates);
};

export const findUserByEmail = async (email: string): Promise<(User & { passwordHash: string }) | null> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const userDoc = querySnapshot.docs[0];
    // Important: The returned object must match the structure your application expects.
    // This includes the passwordHash which is needed for authentication but should not be sent to the client.
    return { id: userDoc.id, ...userDoc.data() } as User & { passwordHash: string };
};
