import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction } from '@/models/transaction.model';

class TransactionService {
  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<string> {
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
  }

  async createWithdrawalRequest(request: any): Promise<void> {
    // Placeholder for creating a withdrawal request
  }
}

export default new TransactionService();
