
"use client";

import { ReactNode } from "react";
import { Header } from "@/components/header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/contexts/auth-context";

export default function MainAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user) {
    // AuthProvider is handling redirects, so we can just show nothing or a loader here
    // to prevent layout flicker for unauthenticated users.
    return null;
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
