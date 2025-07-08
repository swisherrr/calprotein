"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email || null)
    }
    fetchUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black">
      {/* Profile Picture */}
      <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-900 mb-6">
        <img
          src="/profile-placeholder.png"
          alt="Profile"
          className="w-24 h-24 object-cover rounded-full"
          style={{ display: 'block' }}
        />
      </div>
      {/* Email */}
      <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {email ? email : <span className="text-gray-400">Loading...</span>}
      </div>
      {/* Settings Section */}
      <div className="w-full max-w-md mt-10">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 pl-1">Settings</h2>
        {/* Settings will go here */}
      </div>
      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="mt-16 text-red-600 dark:text-red-400 text-base font-medium rounded-full px-8 py-2 border border-red-100 dark:border-red-900 bg-transparent hover:bg-red-50 dark:hover:bg-red-900 transition-none"
        style={{ boxShadow: 'none' }}
      >
        Sign Out
      </button>
    </div>
  )
}
