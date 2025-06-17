"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export function Navbar() {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-xl">
          calprotein
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/workout">
            <Button variant="outline" size="sm">
              Workout
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" size="sm">
              Profile
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  )
} 