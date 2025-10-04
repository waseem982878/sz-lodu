
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { admin } from '@/lib/firebase-admin';
import { updateUserProfile } from '@/services/user-service';
import { createTransaction } from '@/services/transaction-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handleSuccessfulDeposit(session: Stripe.Checkout.Session) {
    const { userId, amount } = session.metadata!;
    const numericAmount = parseFloat(amount);

    try {
        // 1. Update user's balance
        const userProfile = await admin.firestore().collection('users').doc(userId).get();
        if (!userProfile.exists) {
            throw new Error(`User with ID ${userId} not found.`);
        }

        const currentBalance = userProfile.data()!.depositBalance || 0;
        const newBalance = currentBalance + numericAmount;
        await updateUserProfile(userId, { depositBalance: newBalance });

        // 2. Create a transaction record
        await createTransaction({
            userId,
            amount: numericAmount,
            type: 'deposit',
            status: 'completed', // The payment is confirmed by Stripe
            details: {
                gateway: 'stripe',
                sessionId: session.id,
                paymentIntentId: session.payment_intent as string,
            }
        });

        console.log(`Deposit successful for user ${userId}. Amount: ${numericAmount}`);

    } catch (error) {
        console.error('Error handling successful deposit:', error);
        // Optionally, you could add more robust error handling here,
        // such as retrying the database update or sending an alert.
    }
}

export async function POST(req: Request) {
  const buf = await req.text();
  const sig = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSuccessfulDeposit(session);
      break;
    default:
      // Unexpected event type
      console.warn(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
