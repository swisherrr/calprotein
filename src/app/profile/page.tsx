"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email || null)
          
          // Fetch user profile to get username
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('user_id', user.id)
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error)
          } else if (profile) {
            setUsername(profile.username)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
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
          src="/profile-placeholder.jpg"
          alt="Profile"
          className="w-24 h-24 object-cover rounded-full"
          style={{ display: 'block' }}
        />
      </div>
      
      {/* Username */}
      <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {loading ? (
          <span className="text-gray-400">Loading...</span>
        ) : username ? (
          `@${username}`
        ) : (
          <span className="text-gray-400">No username set</span>
        )}
      </div>
      
      {/* Email */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {email ? email : <span className="text-gray-400">Loading...</span>}
      </div>
      
      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="mt-16 text-red-600 dark:text-red-400 text-base font-medium rounded-full px-8 py-2 border border-red-100 dark:border-red-900 bg-transparent hover:bg-red-100 dark:hover:bg-red-900 transition-none"
        style={{ boxShadow: 'none' }}
      >
        Sign Out
      </button>
    </div>
  )
}
