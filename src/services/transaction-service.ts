
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, runTransaction, doc, getDoc, query, where, getDocs, orderBy, limit, increment, updateDoc, Timestamp } from 'firebase/firestore';
import { uploadImage } from './storage-service';
import type { UserProfile } from '@/models/user.model';
import type { PaymentUpi } from '@/models/payment-upi.model';
import type { Transaction } from '@/models/transaction.model';

// This function is for creating a checkout session, not a direct deposit request.
// The actual deposit confirmation will be handled by Stripe webhooks.
export const createStripeCheckoutSession = async (userId: string, priceId: string): Promise<string> => {
    if (!userId || !priceId) {
        throw new Error("User ID and Price ID are required.");
    }

    const checkoutSessionRef = await addDoc(
        collection(db, 'users', userId, 'checkout_sessions'),
        {
            price: priceId,
            success_url: `${window.location.origin}/wallet?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: window.location.origin + '/wallet/deposit',
        }
    );

    return checkoutSessionRef.id;
};


export const createWithdrawalRequest = async (
  userId: string,
  amount: number,
  withdrawalDetails: { method: 'upi' | 'bank'; address: string }
): Promise<string> => {
  if (!db) {
    throw new Error("Database not available. Cannot create withdrawal request.");
  }
  if (!userId || !amount || !withdrawalDetails) {
    throw new Error("User ID, amount, and withdrawal details are required.");
  }

  const userRef = doc(db, 'users', userId);

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error("User profile not found.");
    }

    const userProfile = userDoc.data() as UserProfile;
    if (userProfile.winningsBalance < amount) {
      throw new Error("Insufficient winnings balance.");
    }
     if (userProfile.kycStatus !== 'Verified') {
      throw new Error("KYC not verified. Please complete KYC to withdraw.");
    }


    transaction.update(userRef, {
      winningsBalance: increment(-amount),
    });

    const newTransactionRef = doc(collection(db, "transactions"));
    
    const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        amount,
        type: 'withdrawal',
        status: 'pending',
        withdrawalDetails,
        paymentSent: false,
        isRead: false,
    };
    
    transaction.set(newTransactionRef, {
        ...transactionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return newTransactionRef.id;
  });
};


export const handleApproveWithdrawal = async (transactionId: string) => {
      try {
        await updateDoc(doc(db, 'transactions', transactionId), {
          status: 'completed',
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        console.error('Error approving withdrawal:', error);
        throw new Error('Error approving withdrawal');
      }
  };

  export const handleRejectTransaction = async (transactionId: string, reason: string, transactionType: 'deposit' | 'withdrawal', userId: string, amount: number) => {
    try {
      await runTransaction(db, async (t) => {
        const transRef = doc(db, 'transactions', transactionId);
        t.update(transRef, {
            status: 'rejected',
            notes: reason,
            updatedAt: serverTimestamp()
        });

        // If it's a rejected withdrawal, refund the amount to the user's winnings balance
        if (transactionType === 'withdrawal') {
            const userRef = doc(db, 'users', userId);
            t.update(userRef, {
                winningsBalance: increment(amount)
            });
        }
      });
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      throw new Error('Error rejecting transaction');
    }
  };


  export const handleApproveDeposit = async (transactionRecord: Transaction) => {
      if (transactionRecord.status !== 'pending' || transactionRecord.type !== 'deposit') return;
      
      const transRef = doc(db, 'transactions', transactionRecord.id);
      const userRef = doc(db, 'users', transactionRecord.userId);

      try {
          await runTransaction(db, async (t) => {
              const depositAmount = transactionRecord.amount;
              const bonusAmount = transactionRecord.bonusAmount || 0;
              const totalCredit = depositAmount + bonusAmount;

              t.update(userRef, { depositBalance: increment(totalCredit) });
              t.update(transRef, { 
                  status: 'completed', 
                  updatedAt: serverTimestamp(),
                  processedBy: { id: "admin", name: "Admin" }
              });
          });
      } catch (error) {
          console.error("Error approving deposit:", error);
          throw new Error("Error approving deposit.");
      }
  }
