
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, User, MessageCircle, Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/leaderboard", label: "Leaders", icon: Trophy },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/home", label: "Play", icon: Swords },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/support", label: "Support", icon: MessageCircle },
];

export function BottomNav() {
    const pathname = usePathname();

    const handleSupportClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.open("https://wa.me/918955982878?text=Hello%2C%20I%20need%20support%20with%20SZ%20LUDO%20app.", "_blank", "noopener,noreferrer");
    }

    const NavLink = ({ href, label, icon: Icon }: { href: string, label: string, icon: React.ElementType }) => {
        const isActive = pathname.startsWith(href);
        const isSupportButton = href === "/support";
        const LinkComponent = isSupportButton ? 'a' : Link;

        return (
             <LinkComponent 
                href={isSupportButton ? "#" : href}
                onClick={isSupportButton ? handleSupportClick : undefined}
                target={isSupportButton ? "_blank" : undefined}
                rel={isSupportButton ? "noopener noreferrer" : undefined}
                className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 w-16"
                aria-label={label}
            >
                <div className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-300 ease-in-out",
                     isActive 
                        ? "bg-primary text-primary-foreground shadow-lg -translate-y-6 border-4 border-background ring-4 ring-primary/20 h-16 w-16" 
                        : "h-10 w-10"
                )}>
                    <Icon className={cn("transition-all", isActive ? "h-8 w-8" : "h-6 w-6")} />
                </div>
            </LinkComponent>
        )
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-background/80 backdrop-blur-md shadow-[0_-4px_12px_-5px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto max-w-lg h-full flex items-center justify-around">
                {navItems.map(item => <NavLink key={item.href} {...item}/>)}
            </div>
        </nav>
    );
}
