import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}
