"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// This page is deprecated, use /create/[battleId] instead
export default function CreateGamePage() {
    const router = useRouter();
    
    useEffect(() => {
        // Use replace to avoid adding a new entry to the browser's history
        router.replace('/play');
    }, [router]);
    
    return (
         <div className="flex justify-center items-center h-screen">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
    )
}
