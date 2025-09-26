
"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X, Wallet, Gift, FileText, Shield, FileQuestion, Headset, ChevronRight, LogOut, MessageSquare, CircleUserRound } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

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
  const { user, userProfile, logout, isAdmin } = useAuth();
  const router = useRouter();
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  useEffect(() => {
      const fetchSocials = async () => {
          const socialRef = doc(db, 'config', 'socialMedia');
          const socialSnap = await getDoc(socialRef);
          if (socialSnap.exists()) {
              setWhatsappLink(socialSnap.data().whatsapp || null);
          }
      };
      fetchSocials();
  }, []);

  const handleLogout = async () => {
      closeSidebar();
      await logout();
      router.replace('/landing');
  }
  
  const handleSupportClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (whatsappLink) {
            window.open(whatsappLink, "_blank", "noopener,noreferrer");
        } else {
            alert("Support contact is not configured yet.");
        }
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
                   <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted">
                        <CircleUserRound className="w-8 h-8 text-muted-foreground" />
                   </div>
                   <div>
                      <h3 className="font-bold text-lg">{userProfile?.name || "New Player"} 👋</h3>
                      <p className="text-sm text-muted-foreground">{user?.phoneNumber || user?.email}</p>
                   </div>
              </div>
              <nav className="flex-grow">
                  <ul>
                      {isAdmin && (
                         <li>
                              <Link href="/admin/dashboard" onClick={closeSidebar} className="flex items-center justify-between p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 mb-2">
                                  <div className="flex items-center gap-4">
                                      <Shield className="h-5 w-5" />
                                      <span className="font-bold">Admin Panel</span>
                                  </div>
                                  <ChevronRight className="h-5 w-5" />
                              </Link>
                          </li>
                      )}
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
                                <MessageSquare className="h-5 w-5" />
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
