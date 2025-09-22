
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home as there is no more complex auth flow
    router.replace('/home');
  }, [router]);

  return (
     <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
        <span className="text-4xl font-bold mb-4 text-primary font-heading">SZ LUDO</span>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
