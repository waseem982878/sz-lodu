"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Swords, Banknote, ShieldCheck, Settings, LogOut, IndianRupee, X, UserCog, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminSidebar } from "@/contexts/admin-sidebar-context";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/battles", icon: Swords, label: "Battles" },
    { href: "/admin/transactions", icon: Banknote, label: "Transactions" },
    { href: "/admin/kyc", icon: ShieldCheck, label: "KYC Requests" },
    { href: "/admin/agents", icon: Users, label: "Agents" },
    { href: "/admin/payments", icon: IndianRupee, label: "Payment UPIs" },
    { href: "/admin/settings", icon: Settings, label: "App Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, closeSidebar } = useAdminSidebar();
  const { logout, userProfile } = useAuth();


  const handleLogout = () => {
    logout();
    router.replace('/landing');
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  return (
    <>
       <div
        onClick={closeSidebar}
        className={cn(
          "fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      <aside className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 flex-shrink-0 bg-white border-r border-gray-200 p-4 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
           isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-2xl font-bold text-center text-gray-800 font-heading">
          SZ LUDO <span className="text-primary">Admin</span>
        </div>
         <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeSidebar}>
            <X className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="p-2 my-4">
        <Link href="/admin/profile" onClick={handleLinkClick} className={cn(
          "flex items-center gap-3 p-3 rounded-lg text-gray-600 font-medium hover:bg-gray-100 hover:text-primary transition-colors",
          pathname === "/admin/profile" ? "bg-primary/10 text-primary" : ""
        )}>
           <UserCog className="h-5 w-5" />
           <div>
               <p className="font-semibold">{userProfile?.name}</p>
               <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
           </div>
        </Link>
      </div>

      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg text-gray-600 font-medium hover:bg-gray-100 hover:text-primary transition-colors",
                  pathname.startsWith(item.href) ? "bg-primary/10 text-primary" : ""
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto space-y-2">
        <Link href="/home" passHref>
          <Button variant="secondary" className="w-full">
            <Home className="mr-2 h-4 w-4" />
            View User App
          </Button>
        </Link>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </aside>
    </>
  );
}
