"use client"

import { useEffect, useState } from "react"
import { useDemo } from "@/components/providers/demo-provider"
import { ThemeSelector } from "@/components/ui/theme-selector"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import ProfilePictureUpload from "@/components/profile/profile-picture-upload"
import ProfilePicture from "@/components/ui/profile-picture"
import { CustomExerciseManager } from "@/components/workout/custom-exercise-manager"

function SettingToggle({ 
  label, 
  description, 
  value, 
  onChange 
}: { 
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void 
}) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex-1 pr-4">
        <span className="text-base text-gray-800 dark:text-gray-200 font-medium block mb-1">{label}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{description}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
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

export default function SettingsPage() {
  const { isDemoMode } = useDemo()
  const [autoLoadReps, setAutoLoadReps] = useState(false)
  const [autoLoadWeight, setAutoLoadWeight] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [privateAccount, setPrivateAccount] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadSettings()
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || null)
        
        // Fetch user profile to get username and profile picture
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('username, profile_picture_url')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        } else if (profile) {
          setUsername(profile.username)
          setProfilePictureUrl(profile.profile_picture_url)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const loadSettings = async () => {
    try {
      // Load local settings
      setAutoLoadReps(localStorage.getItem('autoLoadReps') === 'true')
      setAutoLoadWeight(localStorage.getItem('autoLoadWeight') === 'true')

      // Load privacy setting from database
      if (!isDemoMode) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('private_account')
            .eq('user_id', user.id)
            .single()
          
          if (profile) {
            setPrivateAccount(profile.private_account || false)
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleReps = (v: boolean) => {
    setAutoLoadReps(v)
    localStorage.setItem('autoLoadReps', v ? 'true' : 'false')
  }

  const handleToggleWeight = (v: boolean) => {
    setAutoLoadWeight(v)
    localStorage.setItem('autoLoadWeight', v ? 'true' : 'false')
  }

  const handleTogglePrivateAccount = async (v: boolean) => {
    setPrivateAccount(v)
    if (!isDemoMode) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('user_profiles')
            .update({ private_account: v })
            .eq('user_id', user.id)
        }
      } catch (error) {
        console.error('Error updating private account setting:', error)
      }
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handlePictureUpdate = (url: string | null) => {
    setProfilePictureUrl(url)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Customize your workout experience and app preferences.
        </p>
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Account</h2>
        
        {/* Profile Picture */}
        <div className="flex items-center mb-4">
          <div className="mr-4">
            <ProfilePicture
              pictureUrl={profilePictureUrl}
              size="lg"
              onClick={() => setUploadDialogOpen(true)}
            />
          </div>
          <div>
            <div className="text-base font-medium text-gray-800 dark:text-gray-200">
              {username ? `@${username}` : 'No username set'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {email || 'Loading...'}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full text-red-600 dark:text-red-400 text-base font-medium rounded-lg px-4 py-2 border border-red-200 dark:border-red-800 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          style={{ boxShadow: 'none' }}
        >
          Sign Out
        </button>
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Appearance</h2>
        <ThemeSelector />
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Workout Settings</h2>
        
        <SettingToggle 
          label="Auto load reps" 
          description="When enabled, entering reps in the first set will automatically fill the same number of reps for all remaining sets in that exercise."
          value={autoLoadReps} 
          onChange={handleToggleReps} 
        />
        
        <SettingToggle 
          label="Auto load weight" 
          description="When enabled, entering weight in the first set will automatically fill the same weight for all remaining sets in that exercise."
          value={autoLoadWeight} 
          onChange={handleToggleWeight} 
        />
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Privacy Settings</h2>
        <SettingToggle 
          label="Private Account" 
          description="When enabled, only your friends can see your templates and logged workouts. When disabled, anyone can view your templates and workouts unless you hide them individually." 
          value={privateAccount} 
          onChange={handleTogglePrivateAccount} 
        />
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <CustomExerciseManager />
      </div>

      {isDemoMode && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You're currently in demo mode. Settings will be saved locally and reset when you exit demo mode.
          </p>
        </div>
      )}

      <ProfilePictureUpload
        currentPictureUrl={profilePictureUrl}
        onPictureUpdate={handlePictureUpdate}
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
      />
    </div>
  )
} 