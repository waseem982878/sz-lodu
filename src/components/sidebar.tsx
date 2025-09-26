
"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X, Wallet, Gift, FileText, Shield, FileQuestion, Headset, ChevronRight, LogOut } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

// Sidebar now contains links not present in the bottom navigation for a cleaner UX.
const navItems = [
    { href: "/wallet", icon: Wallet, label: "Wallet & History" },
    { href: "/refer", icon: Gift, label: "Refer & Earn" },
    { href: "/support", icon: Headset, label: "Support Center"},
    { href: "/terms", icon: FileText, label: "Term & Conditions" },
    { href: "/gst", icon: FileText, label: "GST Policy" },
    { href: "/privacy", icon: Shield, label: "Privacy Policy" },
    { href: "/refund", icon: FileQuestion, label: "Refund Policy" },
];

export function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
      closeSidebar();
      await logout();
      router.replace('/landing');
  }
  
  const handleSupportClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.open("https://wa.me/919351993756?text=Hello%2C%20I%20need%20support%20with%20SZ%20LUDO%20app.", "_blank", "noopener,noreferrer");
        closeSidebar();
  }

  return (
    <>
      <div className={cn("fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity", isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={closeSidebar}></div>
      <div className={cn(
          "fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/home" onClick={closeSidebar} className="flex items-center">
              <span className="text-xl font-bold">SZ LUDO</span>
            </Link>
              <Button variant="ghost" size="icon" onClick={closeSidebar}>
                  <X className="h-6 w-6" />
              </Button>
          </div>
          <div className="p-4 flex flex-col h-[calc(100%-70px)]">
              <div className="flex items-center gap-4 mb-6">
                   <Image src={userProfile?.avatarUrl || "https://picsum.photos/48/48"} alt="User Avatar" width={48} height={48} className="rounded-full" />
                   <div>
                      <h3 className="font-bold text-lg">{userProfile?.name || "New Player"} 👋</h3>
                      <p className="text-sm text-muted-foreground">{user?.phoneNumber || user?.email}</p>
                   </div>
              </div>
              <nav className="flex-grow">
                  <ul>
                      {navItems.map((item) => (
                          <li key={item.href}>
                              <Link href={item.href} onClick={closeSidebar} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <div className="flex items-center gap-4">
                                      <item.icon className="h-5 w-5" />
                                      <span>{item.label}</span>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                              </Link>
                          </li>
                      ))}
                      <li>
                        <a href="#" onClick={handleSupportClick} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                           <div className="flex items-center gap-4">
                                <Headset className="h-5 w-5" />
                                <span>WhatsApp Support</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </a>
                      </li>
                  </ul>
              </nav>
              <div className="mt-auto">
                 <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    LOG OUT
                 </Button>
              </div>
          </div>
      </div>
    </>
  )
}
