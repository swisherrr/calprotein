"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "./navbar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't show navbar on auth pages and home page
  const hideNavbarPaths = ['/', '/login', '/signup', '/reset-password', '/update-password']
  const shouldShowNavbar = !hideNavbarPaths.includes(pathname)

  if (shouldShowNavbar) {
    return (
      <div className="flex h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col md:pt-0 pt-16">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
} 