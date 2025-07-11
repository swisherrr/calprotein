"use client"

import { useDemo } from "@/components/providers/demo-provider"

export function DemoBanner() {
  const { isDemoMode } = useDemo()

  if (!isDemoMode) return null


  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 text-center relative">
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium">
          You're in demo mode - try out all features! No data will be saved.
        </span>
      </div>
    </div>
  )
} 