"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HistoryPage() {
    const router = useRouter();

    useEffect(() => {
        // This page is obsolete, redirect to the wallet page which now contains history.
        router.replace('/wallet');
    }, [router]);

    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
}
