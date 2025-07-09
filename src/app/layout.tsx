import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/providers/supabase-provider";
import { Toaster } from 'sonner'
import { LayoutWrapper } from "@/components/layout-wrapper"
import Link from "next/link"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "gainerithm",
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
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </SupabaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
