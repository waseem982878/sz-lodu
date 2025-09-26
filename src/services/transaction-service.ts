
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, runTransaction, doc, query, where, getDocs, orderBy, limit, increment, getDoc } from 'firebase/firestore';
import { uploadImage } from './storage-service';
import type { UserProfile } from '@/models/user.model';
import type { PaymentUpi } from '@/models/payment-upi.model';
import type { Transaction } from '@/models/transaction.model';

/**
 * Creates a new deposit request for an admin to review.
 * @param userId - The ID of the user making the deposit.
 * @param amount - The amount being deposited by the user.
 * @param bonusAmount - The GST bonus amount to be added.
 * @param screenshotFile - The payment screenshot file.
 * @param upiId - The UPI ID string used for payment.
 * @returns The ID of the newly created transaction document.
 */
export const createDepositRequest = async (
  userId: string,
  amount: number,
  bonusAmount: number,
  screenshotFile: File,
  upiId: string
): Promise<string> => {
  if (!db) {
    throw new Error("Database not available. Cannot create deposit request.");
  }
  if (!userId || amount <= 0 || !screenshotFile || !upiId) {
    throw new Error("User ID, amount, screenshot file, and UPI ID are required.");
  }

  try {
    const filePath = `deposits/${userId}/${Date.now()}_${screenshotFile.name}`;
    const screenshotUrl = await uploadImage(screenshotFile, filePath);

    const transactionsCollection = collection(db, 'transactions');
    const newTransactionData: Partial<Transaction> = {
      userId,
      amount,
      bonusAmount, // Correctly pass the bonus amount
      type: 'deposit',
      status: 'pending',
      screenshotUrl,
      upiId: upiId,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      isRead: false,
    };

    const docRef = await addDoc(transactionsCollection, newTransactionData);

    return docRef.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Could not create deposit request. Please try again. Error: ${errorMessage}`);
  }
};


/**
 * Creates a new withdrawal request for an admin to review.
 * @param userId - The ID of the user making the withdrawal.
 * @param amount - The amount being withdrawn.
 * @param withdrawalDetails - The details for the withdrawal (UPI or bank).
 * @returns The ID of the newly created transaction document.
 */
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
    
    const transactionData: Partial<Transaction> = {
        userId,
        amount,
        type: 'withdrawal',
        status: 'pending',
        withdrawalDetails,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        paymentSent: false,
        isRead: false,
    };
    
    transaction.set(newTransactionRef, transactionData);

    return newTransactionRef.id;
  });
};


/**
 * Finds an active UPI that is under its daily limit.
 * @returns An active UPI object or null if none are available.
 */
export const getActiveUpi = async (): Promise<PaymentUpi | null> => {
    if (!db) {
        console.error("Database not available. Cannot get active UPI.");
        return null;
    }
    const q = query(
        collection(db, 'payment_upis'),
        where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const upis: PaymentUpi[] = [];
    querySnapshot.forEach(doc => {
        upis.push({ id: doc.id, ...doc.data() } as PaymentUpi);
    });

    // Find the first UPI that is not over its limit
    for (const upi of upis) {
        if (upi.currentReceived < upi.dailyLimit) {
            return upi; 
        }
    }

    // If all active UPIs are over their limit, return null
    return null; 
};
