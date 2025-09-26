
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, runTransaction, doc, getDoc, query, where, getDocs, orderBy, limit, increment } from 'firebase/firestore';
import { uploadImage } from './storage-service';
import type { UserProfile } from '@/models/user.model';
import type { PaymentUpi } from '@/models/payment-upi.model';
import type { Transaction } from '@/models/transaction.model';

/**
 * Creates a new deposit request for an admin to review.
 * This function is now transaction-safe.
 * @param userId - The ID of the user making the deposit.
 * @param amount - The amount being deposited by the user.
 * @param gstBonusAmount - The GST bonus amount to be added.
 * @param screenshotFile - The payment screenshot file.
 * @param upiId - The DOCUMENT ID of the payment_upis document.
 * @returns The ID of the newly created transaction document.
 */
export const createDepositRequest = async (
  userId: string,
  amount: number,
  gstBonusAmount: number,
  screenshotFile: File,
  upiId: string // This should be the document ID from payment_upis
): Promise<string> => {
  if (!userId || amount <= 0 || !screenshotFile || !upiId) {
    throw new Error("User ID, amount, screenshot file, and UPI document ID are required.");
  }
  if (!screenshotFile.type.startsWith('image/')) {
    throw new Error("Please upload an image file.");
  }

  const upiRef = doc(db, 'payment_upis', upiId);

  // Run the database updates in a transaction for safety
  return await runTransaction(db, async (transaction) => {
    const upiDoc = await transaction.get(upiRef);
    if (!upiDoc.exists()) {
      throw new Error("Selected UPI payment method not found.");
    }
    const upiData = upiDoc.data() as PaymentUpi;
    if (!upiData.isActive) {
      throw new Error("Selected UPI payment method is currently not active.");
    }
    if (upiData.currentReceived + amount > upiData.dailyLimit) {
      throw new Error("This UPI ID has reached its daily limit. Please try another method or contact support.");
    }

    // Upload image first. If it fails, the transaction will be rolled back.
    const timestamp = Date.now();
    const filePath = `deposits/${userId}/${timestamp}_${screenshotFile.name}`;
    const screenshotUrl = await uploadImage(screenshotFile, filePath);

    // If image upload is successful, proceed with DB operations
    
    // Update the UPI provider's received amount
    transaction.update(upiRef, {
      currentReceived: increment(amount)
    });

    // Create the transaction record
    const newTransactionRef = doc(collection(db, "transactions"));
    
    const transactionData: Omit<Transaction, 'id'> = {
        userId,
        amount,
        bonusAmount: gstBonusAmount || 0,
        type: 'deposit',
        status: 'pending',
        screenshotUrl,
        upiId: upiData.upiId, // Store the actual UPI string for reference
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isRead: false,
    };
    
    transaction.set(newTransactionRef, transactionData);

    return newTransactionRef.id;
  });
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
