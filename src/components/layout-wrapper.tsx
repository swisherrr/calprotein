"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "./navbar"
import { DemoBanner } from "./demo-banner"
import { MobileBottomNavbar } from "./mobile-bottom-navbar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't show navbar on auth pages and home page
  const hideNavbarPaths = ['/', '/login', '/signup', '/reset-password', '/update-password']
  const shouldShowNavbar = !hideNavbarPaths.includes(pathname)

  if (shouldShowNavbar) {
    return (
      <div className="flex min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col md:pt-0 pt-16 overflow-auto md:pb-0 pb-20">
          <DemoBanner />
          {children}
        </div>
        <MobileBottomNavbar />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
} 