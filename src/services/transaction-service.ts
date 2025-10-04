
import { db } from './firebase-service';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';

export interface Transaction {
  id?: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'battle-fee' | 'battle-win';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: any;
  updatedAt: any;
  description: string;
  gatewayDetails?: {
    gateway: 'stripe' | 'manual';
    transactionId?: string;
    sessionId?: string;
    paymentIntentId?: string;
    screenshotURL?: string;
  };
}

const transactionsCollection = collection(db, 'transactions');

export const createTransaction = async (
  transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const docRef = await addDoc(transactionsCollection, {
    ...transaction,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<void> => {
    const txDoc = doc(db, 'transactions', id);
    await updateDoc(txDoc, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const q = query(transactionsCollection, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};
