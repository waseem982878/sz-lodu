
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdminApp } from '@/firebase/admin-config';
import { auth as adminAuth } from 'firebase-admin';

// This API route is responsible for creating a session cookie.
// It is called by the client after a user successfully signs in with Firebase Auth on the client-side.
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const idToken = body.idToken;

        if (!idToken) {
            return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
        }

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const adminApp = getFirebaseAdminApp();
        const sessionCookie = await adminAuth(adminApp).createSessionCookie(idToken, { expiresIn });

        // Set the cookie on the response
        cookies().set('session', sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Session login error:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}

// This API route is responsible for clearing the session cookie upon sign-out.
export async function DELETE(request: NextRequest) {
    try {
        // Clear the cookie on the response
        cookies().delete('session');
        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Session logout error:', error);
        return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 });
    }
}
