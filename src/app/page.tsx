
"use client";

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

// This is a simple client component that shows a loader while the AuthProvider decides where to go.
// The AuthProvider, which wraps this in the root layout, handles all logic.
export default function RootPage() {
  const { authLoading, profileLoading } = useAuth();

  // This loader is a fallback. The main global loader is in AuthProvider.
  if (authLoading || profileLoading) {
     return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
            <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  // Once loading is false, AuthProvider's redirection useEffect will have already fired
  // or will fire immediately, taking the user to the correct page.
  // Rendering a minimal loader here prevents any flicker of content.
  return (
     <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
        <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

