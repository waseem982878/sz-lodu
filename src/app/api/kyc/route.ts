import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/upload';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const authToken = req.headers.get('authorization') || '';
        const decodedToken = await getAuth(adminApp).verifyIdToken(authToken);
        const userId = decodedToken.uid;

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const documentType = formData.get('documentType') as string;

        if (!file || !documentType) {
            return NextResponse.json({ error: 'File and document type are required' }, { status: 400 });
        }

        const filePath = `kyc/${userId}/${file.name}`;
        const downloadURL = await uploadFile(file, filePath);

        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            kycStatus: 'pending',
            kycDetails: {
                documentType,
                documentUrl: downloadURL,
                submittedAt: serverTimestamp(),
            },
        });

        return NextResponse.json({ message: 'KYC submitted successfully', url: downloadURL });

    } catch (error: any) {
        console.error('KYC submission error:', error);
        if (error.code === 'auth/id-token-expired') {
            return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
