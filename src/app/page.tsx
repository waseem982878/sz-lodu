
"use client";

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

// This is now a simple client component. 
// Its only job is to show a loader while the AuthProvider figures out where to redirect.
export default function RootPage() {
  const { loading } = useAuth();

  // The AuthProvider handles all logic and shows its own loader.
  // This component can return a simple loader or null.
  // This avoids any server-client hydration mismatches or routing conflicts.
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
        <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
