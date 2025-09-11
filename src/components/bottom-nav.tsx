
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, User, MessageCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
    { href: "/home", label: "Play", icon: Home },
    { href: "/leaderboard", label: "Leaders", icon: Trophy },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/support", label: "Support", icon: MessageCircle },
];

export function BottomNav() {
    const pathname = usePathname();
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        let bestMatchIndex = -1;
        let longestMatch = -1;

        navItems.forEach((item, index) => {
            // Use exact match for home, startsWith for others
            const isMatch = item.href === '/home' ? pathname === item.href : pathname.startsWith(item.href);
            if (isMatch) {
                if (item.href.length > longestMatch) {
                    longestMatch = item.href.length;
                    bestMatchIndex = index;
                }
            }
        });
        
        setActiveIndex(bestMatchIndex !== -1 ? bestMatchIndex : 0);

    }, [pathname]);

    const handleSupportClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.open("https://wa.me/918955982878?text=Hello%2C%20I%20need%20support%20with%20SZ%20LUDO%20app.", "_blank", "noopener,noreferrer");
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-background/80 backdrop-blur-md border-t border-border">
            <div className="container mx-auto max-w-lg h-full relative flex items-center">
                <div
                    className="absolute top-0 h-full rounded-md bg-primary/10 transition-all duration-300 ease-in-out"
                    style={{
                        width: `${100 / navItems.length}%`,
                        left: `${activeIndex * (100 / navItems.length)}%`,
                    }}
                />

                {navItems.map((item, index) => {
                    const isActive = activeIndex === index;
                    const isSupportButton = item.href === "/support";
                    
                    const LinkComponent = isSupportButton ? 'a' : Link;

                    return (
                        <LinkComponent 
                            href={isSupportButton ? "#" : item.href}
                            key={item.href}
                            onClick={isSupportButton ? handleSupportClick : undefined}
                            target={isSupportButton ? "_blank" : undefined}
                            rel={isSupportButton ? "noopener noreferrer" : undefined}
                            className={cn(
                                "relative z-10 flex flex-1 flex-col items-center justify-center gap-1 h-full transition-colors duration-300 ease-in-out",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                            )}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </LinkComponent>
                    );
                })}
            </div>
        </nav>
    );
}
