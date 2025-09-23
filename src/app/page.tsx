
"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This is the root page. It will only show a loader.
// The actual content is determined by the AuthProvider, which will redirect
// to either the landing page or the home page.
export default function RootPage() {
    const { loading, user, userProfile, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // The redirection logic is now fully handled in AuthProvider.
        // This component just shows a loader while AuthProvider works.
        // We can add a fallback here just in case, but it shouldn't be necessary.
        if (!loading) {
            if (!user) {
                router.replace('/landing');
            } else if (isAdmin) {
                router.replace('/admin/dashboard');
            } else if (userProfile) {
                router.replace('/home');
            } else {
                router.replace('/signup/profile');
            }
        }
    }, [loading, user, userProfile, isAdmin, router]);


    // This loader is a fallback while the AuthProvider decides where to redirect.
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
