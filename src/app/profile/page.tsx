"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

function SettingToggle({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-base text-gray-800 dark:text-gray-200 font-medium">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        style={{ boxShadow: 'none', border: 'none', padding: 0 }}
        aria-pressed={value}
        type="button"
      >
        <span
          className={`inline-block w-5 h-5 transform bg-white dark:bg-black rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()
  const [autoLoadReps, setAutoLoadReps] = useState(false)
  const [autoLoadWeight, setAutoLoadWeight] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email || null)
    }
    fetchUser()
    // Load settings from localStorage
    setAutoLoadReps(localStorage.getItem('autoLoadReps') === 'true')
    setAutoLoadWeight(localStorage.getItem('autoLoadWeight') === 'true')
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleToggleReps = (v: boolean) => {
    setAutoLoadReps(v)
    localStorage.setItem('autoLoadReps', v ? 'true' : 'false')
  }
  const handleToggleWeight = (v: boolean) => {
    setAutoLoadWeight(v)
    localStorage.setItem('autoLoadWeight', v ? 'true' : 'false')
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
        <SettingToggle label="Auto load reps" value={autoLoadReps} onChange={handleToggleReps} />
        <SettingToggle label="Auto load weight" value={autoLoadWeight} onChange={handleToggleWeight} />
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
