
import type { Metadata, Viewport } from "next";
import { Poppins, Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: '--font-poppins',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: "SZ LUDO",
  description: "Win Real Cash on SZ LUDO",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#B91C1C", // Red color
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${montserrat.variable} font-sans`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
