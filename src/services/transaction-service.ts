import { updateDoc, doc, runTransaction, collection, query, where, getDocs, writeBatch, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Transaction } from '@/models/transaction.model';

// Function to get transactions for a specific user
export const getUserTransactions = async (userId: string) => {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const handleApproveDeposit = async (transaction: Transaction) => {
  return await runTransaction(db, async (txn) => {
    // Update transaction status
    const txRef = doc(db, 'transactions', transaction.id);
    txn.update(txRef, {
      status: 'completed',
      completedAt: new Date()
    });

    // Update user balance
    const userRef = doc(db, 'users', transaction.userId);
    const userDoc = await txn.get(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const newDepositBalance = (userData.depositBalance || 0) + transaction.amount;
    const newTotalDeposits = (userData.totalDeposits || 0) + transaction.amount;

    txn.update(userRef, {
      depositBalance: newDepositBalance,
      totalDeposits: newTotalDeposits,
      updatedAt: new Date()
    });
  });
};

export const handleApproveWithdrawal = async (transactionId: string) => {
  const txRef = doc(db, 'transactions', transactionId);
  await updateDoc(txRef, {
    status: 'completed',
    completedAt: new Date()
  });
};

export const handleRejectTransaction = async (
  transactionId: string, 
  reason: string, 
  type: string,
  userId: string,
  amount: number
) => {
  const txRef = doc(db, 'transactions', transactionId);
  await updateDoc(txRef, {
    status: 'rejected',
    adminNotes: reason,
    completedAt: new Date()
  });

  // For withdrawals, return the amount to user's winnings balance
  if (type === 'withdrawal') {
    const userRef = doc(db, 'users', userId);
    const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      await updateDoc(doc(db, 'users', userId), {
        winningsBalance: (userData.winningsBalance || 0) + amount,
        updatedAt: new Date()
      });
    }
  }
};

// Additional utility functions
export const getPendingTransactions = async () => {
  const q = query(
    collection(db, 'transactions'),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const bulkUpdateTransactions = async (transactionIds: string[], status: string) => {
  const batch = writeBatch(db);
  
  transactionIds.forEach(id => {
    const txRef = doc(db, 'transactions', id);
    batch.update(txRef, {
      status: status,
      updatedAt: new Date()
    });
  });
  
  await batch.commit();
};