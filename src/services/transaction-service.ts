import { collection, doc, addDoc, getDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Transaction Service Structure
export class TransactionService {

    static transactionsCollection = collection(db, 'transactions');

    static async createTransaction(userId: string, amount: number, type: 'credit' | 'debit', description: string) {
        const transactionData = {
            userId,
            amount,
            type,
            description,
            status: 'completed',
            createdAt: serverTimestamp(),
        };
        
        const docRef = await addDoc(this.transactionsCollection, transactionData);
        return { id: docRef.id, ...transactionData };
    }

    static async getUserTransactions(userId: string) {
        const q = query(this.transactionsCollection, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}
