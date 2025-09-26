
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, runTransaction, doc, getDoc, query, where, getDocs, orderBy, limit, increment } from 'firebase/firestore';
import { uploadImage } from './storage-service';
import type { UserProfile } from '@/models/user.model';
import type { PaymentUpi } from '@/models/payment-upi.model';
import type { Transaction } from '@/models/transaction.model';

/**
 * Creates a new deposit request for an admin to review.
 * @param userId - The ID of the user making the deposit.
 * @param amount - The amount being deposited by the user.
 * @param gstBonusAmount - The GST bonus amount to be added.
 * @param screenshotFile - The payment screenshot file.
 * @param upiId - The UPI ID string (from payment_upis collection).
 * @returns The ID of the newly created transaction document.
 */
export const createDepositRequest = async (
  userId: string,
  amount: number,
  gstBonusAmount: number,
  screenshotFile: File,
  upiId: string
): Promise<string> => {
  // Validation
  if (!userId || amount <= 0 || !screenshotFile || !upiId) {
    throw new Error("User ID, amount, screenshot file, and UPI ID are required.");
  }

  if (amount <= 0) {
    throw new Error("Deposit amount must be greater than zero.");
  }

  try {
    // Check if user exists
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("User profile not found.");
    }
    
    // Upload screenshot first
    const filePath = `deposits/${userId}/${Date.now()}_${screenshotFile.name}`;
    const screenshotUrl = await uploadImage(screenshotFile, filePath);

    // Create transaction with additional safety checks
    const newTransactionRef = doc(collection(db, "transactions"));
    
    const newTransactionData: Omit<Transaction, 'id'|'createdAt'|'updatedAt'> = {
        userId,
        amount,
        bonusAmount: gstBonusAmount || 0,
        type: 'deposit',
        status: 'pending',
        screenshotUrl,
        upiId: upiId,
        isRead: false,
    };
    
    // Use setDoc instead of addDoc as we are within a transaction
    await setDoc(newTransactionRef, {
        ...newTransactionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return newTransactionRef.id;

  } catch (error) {
    console.error('Deposit request error:', error);
    
    if (error instanceof Error) {
      // Firebase specific errors
      if (error.message.includes('not-found')) {
        throw new Error("Payment method not found. Please try again.");
      }
      if (error.message.includes('permission-denied')) {
        throw new Error("You don't have permission to perform this action.");
      }
      if (error.message.includes('failed-precondition')) {
        throw new Error("System busy. Please try again in a moment.");
      }
      
      throw new Error(`Deposit request failed: ${error.message}`);
    }
    
    throw new Error("Could not create deposit request. Please try again.");
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


/**
 * Finds an active UPI that is under its daily limit.
 * @returns An active UPI object or null if none are available.
 */
export const getActiveUpi = async (amount?: number): Promise<PaymentUpi | null> => {
  try {
    const q = query(
      collection(db, 'payment_upis'),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const upis: PaymentUpi[] = [];
    
    querySnapshot.forEach(doc => {
      upis.push({ id: doc.id, ...doc.data() } as PaymentUpi);
    });

    // Filter UPIs that can accept the requested amount
    const availableUpis = amount 
      ? upis.filter(upi => (upi.currentReceived + amount) <= upi.dailyLimit)
      : upis.filter(upi => upi.currentReceived < upi.dailyLimit);

    // Return the UPI with most capacity remaining
    if (availableUpis.length > 0) {
      return availableUpis.sort((a, b) => 
        (b.dailyLimit - b.currentReceived) - (a.dailyLimit - a.currentReceived)
      )[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching active UPI:', error);
    return null;
  }
};
