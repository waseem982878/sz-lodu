import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
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

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactionsCollection = collection(db, 'transactions');
    const q = query(transactionsCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    return transactions;
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    throw new Error('Failed to fetch user transactions');
  }
};

export const createWithdrawalRequest = async (request: any): Promise<void> => {
  // Placeholder for creating a withdrawal request
};

class TransactionService {
  // ... other methods
}

export default new TransactionService();
