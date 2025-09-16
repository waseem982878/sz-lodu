
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Swords, Banknote, ShieldCheck, Settings, LogOut, IndianRupee, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useAdminSidebar } from "@/contexts/admin-sidebar-context";

const superAdminNavItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/battles", icon: Swords, label: "Battles" },
    { href: "/admin/transactions", icon: Banknote, label: "Transactions" },
    { href: "/admin/kyc", icon: ShieldCheck, label: "KYC Requests" },
    { href: "/admin/agents", icon: Users, label: "Agents" },
    { href: "/admin/payments", icon: IndianRupee, label: "Payment UPIs" },
    { href: "/admin/settings", icon: Settings, label: "App Settings" },
];

const agentNavItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/transactions", icon: Banknote, label: "Transactions" },
]

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, isSuperAdmin } = useAuth();
  const { isSidebarOpen, closeSidebar } = useAdminSidebar();

  const navItems = isSuperAdmin ? superAdminNavItems : agentNavItems;

  const handleLinkClick = () => {
    // Close sidebar on navigation in mobile view
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  return (
    <>
       {/* Overlay for mobile */}
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
      <div className="flex items-center justify-between p-4">
        <div className="text-2xl font-bold text-center text-gray-800 font-heading">
          SZ LUDO <span className="text-primary">Admin</span>
        </div>
         <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeSidebar}>
            <X className="h-6 w-6" />
        </Button>
      </div>

      <nav className="flex-grow mt-8">
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
      <div className="mt-auto">
        <Button variant="outline" className="w-full" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </aside>
    </>
  );
}

    