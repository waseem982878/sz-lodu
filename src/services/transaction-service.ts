import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction, TransactionType } from '@/models/transaction.model';

const transactionsCollection = collection(db, 'transactions');

export const createTransaction = async (data: {
  userId: string;
  amount: number;
  type: TransactionType;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  orderId?: string;
  battleId?: string;
}): Promise<string> => {
  const docRef = await addDoc(transactionsCollection, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const q = query(transactionsCollection, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};
