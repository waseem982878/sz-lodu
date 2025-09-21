
"use client";

import { Loader2 } from 'lucide-react';

// This is the root entry point.
// It shows a global loader while the AuthProvider determines the user's state.
// All redirection logic is now handled in the AuthProvider.
export default function RootPage() {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
