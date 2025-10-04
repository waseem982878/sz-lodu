import { PaymentService } from '@/services/payment.service';

// This should be set up as a cron job (Vercel cron, etc.)
export async function expirePendingPayments() {
  try {
    await PaymentService.expirePendingPayments();
    console.log('Expired pending payments');
  } catch (error) {
    console.error('Failed to expire payments:', error);
  }
}
