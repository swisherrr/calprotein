import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/providers/supabase-provider";
import { DemoProvider } from "@/components/providers/demo-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
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
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          <SupabaseProvider>
            <DemoProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </DemoProvider>
          </SupabaseProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
