"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// This page is deprecated and now redirects to the main play page.
export default function CreateGamePage() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace('/play');
    }, [router]);
    
    return (
         <div className="flex justify-center items-center h-screen">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
    )
}
