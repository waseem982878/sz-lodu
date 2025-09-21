
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config"; // Assuming this is the correct path to your Firebase config

import { Header } from "@/components/header";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/landing",
  "/privacy",
  "/terms",
  "/refund",
  "/support",
  "/gst",
  // Add any other public routes here, e.g., '/signup'
];

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

      if (user) {
        // User is authenticated, allow access
        setIsLoading(false);
      } else {
        // User is not authenticated
        if (isPublicRoute) {
          // If it's a public route, allow access
          setIsLoading(false);
        } else {
          // If it's a protected route, redirect to login
          router.push("/login");
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [pathname, router]);

  // While checking authentication, show a full-page loader
  // This prevents child components (and their data fetches) from running prematurely
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // If the page is public and the user is not logged in, they might not need the full layout
  // However, for simplicity and consistency, we'll render the layout for all pages.
  // You can add more complex logic here if needed.
  // For example: if (PUBLIC_ROUTES.includes(pathname)) return <>{children}</>;

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
