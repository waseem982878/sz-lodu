
import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminSidebarProvider } from "@/contexts/admin-sidebar-context";
import { AdminHeader } from "@/components/admin-header";
import { AuthProvider } from "@/contexts/auth-context";
import { AdminBottomNav } from "@/components/admin-bottom-nav";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminSidebarProvider>
        <div className="flex h-screen bg-muted/40">
          <AdminSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <AdminHeader />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-4 pb-28 sm:pb-24">
              {children}
            </main>
          </div>
          <AdminBottomNav />
        </div>
      </AdminSidebarProvider>
    </AuthProvider>
  );
}
