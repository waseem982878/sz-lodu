import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment.service';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const authToken = req.headers.get('authorization') || '';
        const decodedToken = await getAuth(adminApp).verifyIdToken(authToken);
        const userId = decodedToken.uid;
        
        const { amount, method } = await req.json();

        if (!amount || !method) {
            return NextResponse.json({ error: 'Amount and payment method are required' }, { status: 400 });
        }

        const payment = await PaymentService.processPayment(userId, amount, method);

        return NextResponse.json(payment);

    } catch (error: any) {
        console.error('Payment processing error:', error);
         if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
