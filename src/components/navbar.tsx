"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  // Don't show navbar on auth pages and home page
  const hideNavbarPaths = ['/', '/login', '/signup', '/reset-password', '/update-password']
  if (hideNavbarPaths.includes(pathname)) {
    return null
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg">
          calprotein
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/workout">
            <Button variant="outline" size="sm" className="text-xs px-2 py-1">
              Workout
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" size="sm" className="text-xs px-2 py-1">
              Profile
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="text-xs px-2 py-1"
          >
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  )
} 