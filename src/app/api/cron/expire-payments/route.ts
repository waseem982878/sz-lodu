import { expirePendingPayments } from '@/lib/cron';

// API route for cron job
// app/api/cron/expire-payments/route.ts
export async function GET() {
  try {
    await expirePendingPayments();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
