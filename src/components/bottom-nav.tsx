
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, User, MessageCircle, Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const leftNavItems = [
    { href: "/leaderboard", label: "Leaders", icon: Trophy },
    { href: "/wallet", label: "Wallet", icon: Wallet },
];

const rightNavItems = [
    { href: "/profile", label: "Profile", icon: User },
    { href: "/support", label: "Support", icon: MessageCircle },
]

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
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
                <div className={cn("flex items-center justify-center gap-2 rounded-full px-4 py-1 transition-all", isActive && "bg-primary/10")}>
                    <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                    <span className={cn("text-xs font-medium", !isActive && "hidden")}>{label}</span>
                </div>
            </LinkComponent>
        )
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-background/80 backdrop-blur-md shadow-[0_-4px_12px_-5px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto max-w-lg h-full relative flex items-center justify-between">
                
                {/* Left Side */}
                <div className="flex justify-around items-center w-[40%]">
                    {leftNavItems.map(item => <NavLink key={item.href} {...item}/>)}
                </div>

                {/* Center Play Button */}
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                    <Link href="/home" className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg border-4 border-background ring-4 ring-primary/20 hover:scale-105 active:scale-95 transition-transform">
                        <Swords className="h-8 w-8" />
                        <span className="sr-only">Play</span>
                    </Link>
                </div>

                {/* Right Side */}
                <div className="flex justify-around items-center w-[40%]">
                    {rightNavItems.map(item => <NavLink key={item.href} {...item}/>)}
                </div>

            </div>
        </nav>
    );
}
