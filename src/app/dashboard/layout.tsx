"use client"

import { ProgressBanners } from "@/components/profile/progress-banners"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-full">
      {/* Progress Banners */}
      <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="container mx-auto">
          <ProgressBanners />
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
} 