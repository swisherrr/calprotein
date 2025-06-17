"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

export function Navbar() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!isLoggedIn) return null

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