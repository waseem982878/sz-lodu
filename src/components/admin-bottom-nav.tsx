
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Banknote, ShieldCheck, Settings, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/battles", label: "Battles", icon: Swords },
    { href: "/admin/transactions", label: "Txs", icon: Banknote },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminBottomNav() {
    const pathname = usePathname();

    const NavLink = ({ href, label, icon: Icon }: { href: string, label: string, icon: React.ElementType }) => {
        // More specific check for active state
        const isActive = href === "/admin/dashboard" ? pathname === href : pathname.startsWith(href);

        return (
             <Link
                href={href}
                className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300 w-16"
                aria-label={label}
            >
                <div className={cn(
                    "flex items-center justify-center rounded-full transition-all duration-300 ease-in-out relative",
                     isActive 
                        ? "bg-primary text-primary-foreground shadow-lg -translate-y-6 border-4 border-background ring-4 ring-primary/20 h-16 w-16" 
                        : "h-12 w-12"
                )}>
                    <Icon className={cn("transition-all", isActive ? "h-7 w-7" : "h-6 w-6")} />
                </div>
                 <span className={cn(
                    "text-xs font-medium transition-opacity duration-200", 
                    isActive ? 'opacity-0' : 'opacity-100 -mt-1'
                )}>
                    {label}
                </span>
            </Link>
        )
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 h-24 bg-background/80 backdrop-blur-md shadow-[0_-4px_12px_-5px_rgba(0,0,0,0.1)] lg:hidden">
            <div className="container mx-auto max-w-lg h-full flex items-center justify-around pt-2">
                {navItems.map(item => <NavLink key={item.href} {...item}/>)}
            </div>
        </nav>
    );
}
