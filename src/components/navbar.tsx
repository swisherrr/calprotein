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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-black/80 dark:border-gray-800">
      <div className="container-apple">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
          gainerithm
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link href="/workout">
              <Button variant="ghost" className="font-medium text-sm px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200">
                Workout
              </Button>
            </Link>
            <Link href="/profile">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-900 cursor-pointer ml-2">
                <img
                  src="/profile-placeholder.jpg"
                  alt="Profile"
                  className="w-8 h-8 object-cover rounded-full"
                  style={{ display: 'block' }}
                />
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
} 