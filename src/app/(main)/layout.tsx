
import { ReactNode } from "react";
import { Header } from "@/components/header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

export default function MainAppLayout({
  children,
}: {
  children: ReactNode;
}) {
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
