
"use client";

import { Button } from "@/components/ui/button";
import { Menu, Wallet } from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";


export function Header() {
    const { openSidebar } = useSidebar();
    const { user, userProfile } = useAuth();
    const [bannerText, setBannerText] = useState("Play Ludo & Win Real Cash on SZ LUDO 😍");
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
          const settingsRef = doc(db, 'config', 'appSettings');
          const docSnap = await getDoc(settingsRef);
          if (docSnap.exists() && docSnap.data().headerBannerText) {
            setBannerText(docSnap.data().headerBannerText);
          }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (!user) return;
        const transQuery = query(collection(db, "transactions"), where("userId", "==", user.uid), where("isRead", "==", false));
        const unsubscribe = onSnapshot(transQuery, (snapshot) => {
            setHasUnread(!snapshot.empty);
        });
        return () => unsubscribe();
    }, [user]);

    const totalBalance = (userProfile?.depositBalance || 0) + (userProfile?.winningsBalance || 0);

    return (
        <header className="w-full">
            <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold">
                {bannerText}
            </div>
            <div className="bg-card shadow-md px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                     {user && (
                        <Button variant="ghost" size="icon" onClick={openSidebar}>
                            <Menu className="h-6 w-6" />
                        </Button>
                    )}
                    <Link href="/home" className="flex items-center">
                        <span className="text-2xl font-extrabold bg-gradient-to-r from-primary via-card-foreground to-primary bg-clip-text text-transparent animate-animate-shine bg-[length:200%_auto] font-heading">SZ LUDO</span>
                    </Link>
                </div>
                {user && (
                    <div className="flex items-center gap-2">
                        <Link href="/wallet">
                             <Button variant="outline" className="relative flex items-center gap-2 border-green-600">
                                {hasUnread && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                    </span>
                                )}
                                <Wallet className="h-5 w-5 text-green-600" />
                                <span className="font-bold">{totalBalance.toFixed(0)}</span>
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
