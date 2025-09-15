
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This is now the root entry point, which will handle redirection.
export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        // The root page's only job is to redirect to the landing page.
        // The AuthProvider will handle further redirection if the user is already logged in.
        router.replace('/landing');
    }, [router]);

    // Show a loader while the redirection logic runs
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
