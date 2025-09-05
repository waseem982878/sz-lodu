import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminSidebarProvider } from "@/contexts/admin-sidebar-context";
import { AdminHeader } from "@/components/admin-header";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminSidebarProvider>
      <div className="flex h-screen bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
           <AdminHeader />
           <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
