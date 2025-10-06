import { updateDoc, doc, runTransaction, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Temporary interface until models are fixed
interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: string;
}

export const handleApproveDeposit = async (transaction: Transaction) => {
  try {
    const txRef = doc(db, 'transactions', transaction.id);
    await updateDoc(txRef, {
      status: 'completed',
      completedAt: new Date()
    });
    
    // Add user balance update logic here later
    return { success: true };
  } catch (error) {
    console.error('Approve deposit error:', error);
    throw error;
  }
};

export const handleApproveWithdrawal = async (transactionId: string) => {
  try {
    const txRef = doc(db, 'transactions', transactionId);
    await updateDoc(txRef, {
      status: 'completed', 
      completedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    throw error;
  }
};

export const handleRejectTransaction = async (
  transactionId: string, 
  reason: string, 
  type: string,
  userId: string,
  amount: number
) => {
  try {
    const txRef = doc(db, 'transactions', transactionId);
    await updateDoc(txRef, {
      status: 'rejected',
      adminNotes: reason,
      completedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Reject transaction error:', error);
    throw error;
  }
};
