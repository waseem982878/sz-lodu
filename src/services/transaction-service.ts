import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction } from '@/models/transaction.model';
import { UserProfile } from '@/models/user.model';

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

export const handleApproveDeposit = async (transaction: Transaction): Promise<void> => {
    const userRef = doc(db, 'users', transaction.userId);
    const transactionRef = doc(db, 'transactions', transaction.id);

    await runTransaction(db, async (t) => {
        const userDoc = await t.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("User not found!");
        }

        const userProfile = userDoc.data() as UserProfile;
        const newBalance = (userProfile.depositBalance || 0) + transaction.amount;

        t.update(userRef, { depositBalance: newBalance });
        t.update(transactionRef, { status: 'completed', updatedAt: serverTimestamp() });
    });
};

export const handleApproveWithdrawal = async (transactionId: string): Promise<void> => {
    const transactionRef = doc(db, 'transactions', transactionId);
    await updateDoc(transactionRef, {
        status: 'completed',
        updatedAt: serverTimestamp(),
    });
};

export const handleRejectTransaction = async (transactionId: string, reason: string, transactionType: string, userId: string, amount: number): Promise<void> => {
    const transactionRef = doc(db, 'transactions', transactionId);

    await runTransaction(db, async (t) => {
        if (transactionType === 'withdrawal') {
            const userRef = doc(db, 'users', userId);
            const userDoc = await t.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User not found!");
            }
            const userProfile = userDoc.data() as UserProfile;
            const newBalance = (userProfile.winningsBalance || 0) + amount;
            t.update(userRef, { winningsBalance: newBalance });
        }

        t.update(transactionRef, {
            status: 'rejected',
            updatedAt: serverTimestamp(),
            rejectionReason: reason
        });
    });
};

class TransactionService {
  // ... other methods
}

export default new TransactionService();
