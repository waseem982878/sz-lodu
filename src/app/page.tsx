
"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// This is the root page. It will only show a loader.
// The actual content is determined by the AuthProvider, which will redirect
// to either the landing page or the home page.
export default function RootPage() {
    const { loading } = useAuth();

    // This loader is a fallback while the AuthProvider decides where to redirect.
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
