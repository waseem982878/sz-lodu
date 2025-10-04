import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc,
  runTransaction, 
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PaymentRequest, PaymentUpi } from '@/models/payment-upi.model';
import { Order } from '@/models/order.model';

export class PaymentService {
  
  // Get active UPI with available limit
  static async getAvailableUpi(amount: number): Promise<PaymentUpi | null> {
    const q = query(
      collection(db, 'payment_upis'),
      where('isActive', '==', true),
      where('dailyLimit', '>=', amount)
    );
    
    const snapshot = await getDocs(q);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const doc of snapshot.docs) {
      const upi = { id: doc.id, ...doc.data() } as PaymentUpi;
      
      const upiUpdatedAt = upi.updatedAt.toDate ? upi.updatedAt.toDate() : new Date(upi.updatedAt);
      if (upiUpdatedAt < today) {
        await updateDoc(doc.ref, {
          currentReceived: 0,
          updatedAt: new Date()
        });
        upi.currentReceived = 0;
      }
      
      if (upi.currentReceived + amount <= upi.dailyLimit) {
        return upi;
      }
    }
    
    return null;
  }

  // Create payment request
  static async createPaymentRequest(order: Order, description?: string): Promise<PaymentRequest> {
    return await runTransaction(db, async (transaction) => {
      const upi = await this.getAvailableUpi(order.amount);
      if (!upi) {
        throw new Error('No available UPI accounts at the moment. Please try again later.');
      }

      const paymentRequest: Omit<PaymentRequest, 'id'> = {
        orderId: order.id,
        userId: order.userId, // Added userId
        amount: order.amount,
        upiId: upi.upiId,
        payeeName: upi.payeeName,
        status: 'pending',
        description: description || `Payment for order #${order.orderNumber}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      };

      const paymentCollectionRef = collection(db, 'payment_requests');
      // In a transaction, we use transaction.set on a new doc ref.
      const newPaymentRef = doc(paymentCollectionRef);
      transaction.set(newPaymentRef, paymentRequest);
      
      const orderRef = doc(db, 'orders', order.id);
      transaction.update(orderRef, {
        paymentRequestId: newPaymentRef.id,
        updatedAt: new Date()
      });

      return { id: newPaymentRef.id, ...paymentRequest } as PaymentRequest;
    });
  }

  // Verify payment (manual verification by admin)
  static async verifyPayment(paymentRequestId: string, transactionId: string): Promise<void> {
    return await runTransaction(db, async (transaction) => {
      const paymentRef = doc(db, 'payment_requests', paymentRequestId);
      const paymentDoc = await transaction.get(paymentRef);
      
      if (!paymentDoc.exists()) {
        throw new Error('Payment request not found');
      }

      const payment = paymentDoc.data() as PaymentRequest;
      
      if (payment.status !== 'pending') {
        throw new Error('Payment already processed');
      }

      if (new Date() > payment.expiresAt) {
        throw new Error('Payment request has expired');
      }

      const upiQuery = query(
        collection(db, 'payment_upis'),
        where('upiId', '==', payment.upiId)
      );
      const upiSnapshot = await getDocs(upiQuery);
      
      if (upiSnapshot.empty) {
        throw new Error('UPI account not found');
      }

      const upiDoc = upiSnapshot.docs[0];
      const upi = upiDoc.data() as PaymentUpi;

      transaction.update(upiDoc.ref, {
        currentReceived: upi.currentReceived + payment.amount,
        updatedAt: new Date()
      });

      transaction.update(paymentRef, {
        status: 'completed',
        completedAt: new Date(),
        transactionId: transactionId
      });

      const orderRef = doc(db, 'orders', payment.orderId);
      transaction.update(orderRef, {
        status: 'paid',
        updatedAt: new Date()
      });
    });
  }

  // Expire pending payments
  static async expirePendingPayments(): Promise<void> {
    const q = query(
      collection(db, 'payment_requests'),
      where('status', '==', 'pending'),
      where('expiresAt', '<', new Date())
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: new Date()
      });
    });

    await batch.commit();
  }

  // Get payment request by ID
  static async getPaymentRequest(id: string): Promise<PaymentRequest | null> {
    const docRef = doc(db, 'payment_requests', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as PaymentRequest;
    }
    return null;
  }

  // Get payment requests by order ID
  static async getPaymentRequestsByOrder(orderId: string): Promise<PaymentRequest[]> {
    const q = query(
      collection(db, 'payment_requests'),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRequest));
  }
}
