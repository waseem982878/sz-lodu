
import { ReactNode } from "react";
import { Header } from "@/components/header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <Sidebar />
          <main className="flex-1 container mx-auto py-2 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          {/* Add padding to the bottom to account for the fixed nav bar */}
          <div className="pb-20"></div>
          <BottomNav />
        </div>
    </SidebarProvider>
  );
}
