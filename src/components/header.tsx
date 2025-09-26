
"use client";

import { Button } from "@/components/ui/button";
import { Menu, Wallet } from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";
import { cn } from "@/lib/utils";

export function Header() {
    const { openSidebar } = useSidebar();
    const { userProfile } = useAuth();
    const [bannerLines, setBannerLines] = useState<string[]>(["Play Ludo & Win Real Cash on SZ LUDO 😍"]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const settingsRef = doc(db, 'config', 'appSettings');
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const text = docSnap.data().headerBannerText;
                if (text && typeof text === 'string') {
                    // Split by newline and filter out empty lines
                    const lines = text.split('\n').filter(line => line.trim() !== '');
                    if (lines.length > 0) {
                        setBannerLines(lines);
                    }
                }
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (bannerLines.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % bannerLines.length);
        }, 4000); // Change text every 4 seconds

        return () => clearInterval(interval);
    }, [bannerLines]);

    const totalBalance = (userProfile?.depositBalance ?? 0) + (userProfile?.winningsBalance ?? 0);

    return (
        <header className="w-full">
            <div className="bg-primary text-primary-foreground text-center py-1 text-xs sm:text-sm font-semibold overflow-hidden h-[28px] relative flex items-center justify-center">
                 <div className="w-full h-full flex items-center justify-center">
                    {bannerLines.map((line, index) => (
                        <span
                            key={index}
                            className={cn(
                                "absolute transition-transform duration-500 ease-in-out",
                                index === currentIndex ? "translate-y-0 opacity-100" : "opacity-0",
                                index > currentIndex ? "translate-y-full" : "-translate-y-full",
                                {"hidden": index !== currentIndex && index !== (currentIndex - 1 + bannerLines.length) % bannerLines.length && index !== (currentIndex + 1) % bannerLines.length}
                            )}
                        >
                            {line}
                        </span>
                    ))}
                </div>
            </div>
            <div className="bg-card shadow-md px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                     <Button variant="ghost" size="icon" onClick={openSidebar}>
                        <Menu className="h-6 w-6" />
                    </Button>
                    <Link href="/home" className="flex items-center">
                        <span className="text-2xl font-extrabold bg-gradient-to-r from-primary via-card-foreground to-primary bg-clip-text text-transparent animate-animate-shine bg-[length:200%_auto] font-heading">SZ LUDO</span>
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/wallet">
                         <Button variant="outline" className="relative flex items-center gap-2 border-green-600">
                            <Wallet className="h-5 w-5 text-green-600" />
                            <span className="font-bold">{totalBalance.toFixed(0)}</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
