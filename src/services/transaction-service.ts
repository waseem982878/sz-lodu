
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp, runTransaction, doc, getDoc, query, where, getDocs, orderBy, limit, increment, updateDoc, Timestamp } from 'firebase/firestore';
import { uploadImage } from './storage-service';
import type { UserProfile } from '@/models/user.model';
import type { PaymentUpi } from '@/models/payment-upi.model';
import type { Transaction } from '@/models/transaction.model';

export const createDepositRequest = async (
  userId: string,
  amount: number,
  gstBonusAmount: number,
  screenshotFile: File,
  upiId: string // This is the document ID from payment_upis
): Promise<string> => {
    // 1. Validate inputs
    if (!userId || amount <= 0 || !screenshotFile || !upiId) {
        throw new Error("User ID, amount, screenshot file, and UPI document ID are required.");
    }
    if (!screenshotFile.type.startsWith('image/')) {
        throw new Error("Please upload an image file.");
    }

    // 2. Prepare for the transaction
    const upiRef = doc(db, 'payment_upis', upiId);
    
    // 3. Run a secure Firestore transaction
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

        // 4. Upload the image - this should be done before the transaction completes if it needs to be atomic.
        // For simplicity and to avoid holding the transaction open during upload, we do it before.
        // In a production system, you might upload, then run a transaction to verify and record.
        const timestamp = Date.now();
        const fileExt = screenshotFile.name.split('.').pop() || 'png';
        const filePath = `deposits/${userId}/${timestamp}.${fileExt}`;
        const screenshotUrl = await uploadImage(screenshotFile, filePath);

        // 5. Update UPI daily received amount
        transaction.update(upiRef, {
            currentReceived: increment(amount)
        });

        // 6. Create the transaction record
        const newTransactionRef = doc(collection(db, 'transactions'));
        const newTransactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
            userId,
            amount,
            bonusAmount: gstBonusAmount || 0,
            type: 'deposit',
            status: 'pending',
            screenshotUrl,
            upiId: upiData.upiId, // Store the actual UPI ID string
            isRead: false,
        };
        transaction.set(newTransactionRef, {
            ...newTransactionData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // 7. Return the new transaction ID
        return newTransactionRef.id;
    });
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

    const availableUpis = amount 
      ? upis.filter(upi => (upi.currentReceived + amount) <= upi.dailyLimit)
      : upis.filter(upi => upi.currentReceived < upi.dailyLimit);

    if (availableUpis.length > 0) {
      // Sort by which UPI has the most capacity remaining
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

  export const handleRejectTransaction = async (transactionId: string, reason: string, transactionType: 'deposit' | 'withdrawal', userId: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'rejected',
        notes: reason,
        updatedAt: Timestamp.now()
      });
      // If it's a rejected withdrawal, refund the amount to the user's winnings balance
      if (transactionType === 'withdrawal') {
          await updateDoc(doc(db, 'users', userId), {
              winningsBalance: increment(amount)
          });
      }
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      throw new Error('Error rejecting transaction');
    }
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
