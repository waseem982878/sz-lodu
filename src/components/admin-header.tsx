
"use client";

import { useAdminSidebar } from "@/contexts/admin-sidebar-context";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

const getTitleFromPath = (path: string): string => {
    const segments = path.split('/').filter(Boolean); // remove empty strings
    if (segments.length > 1) {
        const title = segments[segments.length - 1];
        if (title === 'users' && segments.length > 2) return "User Details";
        return title.charAt(0).toUpperCase() + title.slice(1).replace('-', ' ');
    }
    return 'Dashboard';
}

export function AdminHeader() {
    const { toggleSidebar } = useAdminSidebar();
    const pathname = usePathname();
    const title = getTitleFromPath(pathname);

    return (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 lg:hidden">
            <Button
                variant="outline"
                size="icon"
                onClick={toggleSidebar}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
            <h1 className="text-lg font-semibold text-primary">{title}</h1>
        </header>
    );
}
