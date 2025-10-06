import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction } from '@/models/transaction.model';

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const transactionCollection = collection(db, 'transactions');
    const docRef = await addDoc(transactionCollection, {
      ...transaction,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create transaction');
  }
};

export const createWithdrawalRequest = async (request: any): Promise<void> => {
  // Placeholder for creating a withdrawal request
};

class TransactionService {
  // ... other methods
}

export default new TransactionService();
