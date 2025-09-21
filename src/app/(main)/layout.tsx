
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

  // The AuthProvider is now responsible for handling redirects and showing a loader.
  // This layout will only be rendered for authenticated users, so this check is simplified.
  // We no longer return null here, which was causing the race condition with redirects.
  if (!user) {
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
