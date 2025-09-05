
"use client";

import { Header } from "@/components/header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, loading } = useAuth();

  if (loading || !userProfile) {
     return (
        <div className="flex flex-col justify-center items-center h-screen bg-background text-center p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <SidebarProvider>
      <div className="h-full flex flex-col">
        <Sidebar />
        <Header />
        <main className="flex-grow p-4 container mx-auto max-w-lg pb-28 overflow-y-auto">
            {children}
        </main>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
