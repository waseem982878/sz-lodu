"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, User, MessageCircle, Trophy, Swords, Shield, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

const userNavItems = [
    { href: "/leaderboard", label: "Leaders", icon: Trophy },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/home", label: "Play", icon: Swords },
    { href: "/dashboard/battle-result", label: "Upload", icon: UploadCloud }, // NEW LINK
    { href: "/profile", label: "Profile", icon: User },
];

const adminNavItem = { href: "/admin/dashboard", label: "Admin", icon: Shield };


export function BottomNav() {
    const pathname = usePathname();
    const { isAdmin } = useAuth();

    const NavLink = ({ href, label, icon: Icon }: { href: string, label: string, icon: React.ElementType }) => {
        const isActive = pathname.startsWith(href);

        return (
             <Link
                href={href}
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
            </Link>
        )
    }

    const itemsToDisplay = [...userNavItems];
    if (isAdmin) {
        // Replace the new 'Upload' link with 'Admin' link for admins
        const uploadIndex = itemsToDisplay.findIndex(item => item.label === 'Upload');
        if (uploadIndex !== -1) {
            itemsToDisplay[uploadIndex] = adminNavItem;
        } else { // Fallback if it wasn't found
            itemsToDisplay.splice(3, 0, adminNavItem); // Add it in a reasonable position
        }
    }


    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-background/80 backdrop-blur-md shadow-[0_-4px_12px_-5px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto max-w-lg h-full flex items-center justify-around">
                {itemsToDisplay.map(item => <NavLink key={item.href} {...item}/>)}
            </div>
        </nav>
    );
}
