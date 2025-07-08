import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/providers/supabase-provider";
import { Toaster } from 'sonner'
import { Navbar } from "@/components/navbar"
import Link from "next/link"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "liftalytics",
  description: "Data-driven fitness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <SupabaseProvider>
          <Navbar />
          <div className="relative min-h-screen">
            {/* Profile Button removed from here */}
            {children}
          </div>
        </SupabaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
