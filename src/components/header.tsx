
"use client";

import { Button } from "@/components/ui/button";
import { Menu, Wallet } from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

export function Header() {
    const { openSidebar } = useSidebar();
    const { userProfile } = useAuth();
    const [bannerLines, setBannerLines] = useState<string[]>([
        "🎉 Welcome to SZ LUDO! Play & Win Big! 🎉",
        "Instant Withdrawals - Get Your Winnings in Minutes! ⚡",
        "Refer a Friend & Earn ₹25 Bonus Cash! 🎁",
        "Daily Leaderboard Prizes! Climb to the Top! 🏆",
        "24/7 Customer Support Available on WhatsApp & Telegram! 💬",
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const settingsRef = doc(db, 'config', 'appSettings');
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const text = docSnap.data().headerBannerText;
                if (text && typeof text === 'string') {
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
        }, 4000); 

        return () => clearInterval(interval);
    }, [bannerLines]);

    const totalBalance = (userProfile?.depositBalance ?? 0) + (userProfile?.winningsBalance ?? 0);

    return (
        <header className="w-full sticky top-0 z-40">
            <div className="bg-primary text-primary-foreground text-center text-xs sm:text-sm font-semibold overflow-hidden h-6 flex items-center justify-center">
                <div className="relative h-full w-full">
                    {bannerLines.map((line, index) => (
                        <span
                            key={index}
                            className={cn(
                                "absolute w-full h-full flex items-center justify-center transition-transform duration-500 ease-in-out",
                                index === currentIndex ? "translate-y-0" : "translate-y-full",
                                {"-translate-y-full": index === (currentIndex - 1 + bannerLines.length) % bannerLines.length}
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
