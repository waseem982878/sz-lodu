
"use client";

import { Loader2 } from 'lucide-react';

// This is now the root entry point, which will simply show a loader.
// The AuthProvider and layout files will handle all redirection logic.
export default function RootPage() {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
