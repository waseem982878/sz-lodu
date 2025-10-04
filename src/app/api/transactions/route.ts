import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transaction-service';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    try {
        const authToken = req.headers.get('authorization') || '';
        const decodedToken = await getAuth(adminApp).verifyIdToken(authToken);
        const userId = decodedToken.uid;
        
        const transactions = await TransactionService.getUserTransactions(userId);
        return NextResponse.json(transactions);

    } catch (error: any) {
        console.error('Error fetching transactions:', error);
         if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
