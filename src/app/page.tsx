
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is now the root entry point, which will handle redirection.
export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        try {
            // Check if the user has been to the landing page before
            const appInstalled = localStorage.getItem('appInstalled');

            if (appInstalled === 'true') {
                // If they have, send them to the login page (or main app)
                router.replace('/login');
            } else {
                // If it's their first time, send them to the new landing page
                router.replace('/landing');
            }
        } catch (error) {
            // Fallback for environments where localStorage is not available (like SSR part)
            // or if there's a security error.
            router.replace('/landing');
        }
    }, [router]);

    // Show a loader while the redirection logic runs
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
