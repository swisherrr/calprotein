"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  // Hide navbar on homepage
  if (pathname === "/") {
    return null
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="font-semibold">
            ACalories
          </Link>
          <div className="hidden md:flex space-x-4">
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link href="/dashboard/workout" className="text-sm font-medium transition-colors hover:text-primary">
              Workout
            </Link>
            <Link href="/dashboard/meal" className="text-sm font-medium transition-colors hover:text-primary">
              Meal
            </Link>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
} 