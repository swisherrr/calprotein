"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ProfilePicture from "@/components/ui/profile-picture"
import { Dumbbell, Users, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WorkoutTemplate {
  id: string
  name: string
  exercises: any[]
  created_at: string
  hidden?: boolean
}

export default function ProfilePage() {
  const [username, setUsername] = useState<string | null>(null)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [templatesPrivate, setTemplatesPrivate] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [hiddenTemplates, setHiddenTemplates] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Fetch user profile to get username, profile picture, and privacy settings
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('username, profile_picture_url, templates_private')
            .eq('user_id', user.id)
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error)
          } else if (profile) {
            console.log('Profile data:', profile)
            setUsername(profile.username)
            setProfilePictureUrl(profile.profile_picture_url)
            setTemplatesPrivate(profile.templates_private || false)
            
            // Load templates and hidden templates after getting profile data
            await loadTemplates(user.id, profile.templates_private || false)
            await loadHiddenTemplates(user.id)
          } else {
            console.log('No profile found')
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

  const loadTemplates = async (userId: string, isPrivate: boolean) => {
    try {
      setTemplatesLoading(true)
      
      // Load templates
      const { data: templatesData, error } = await supabase
        .from('workout_templates')
        .select('id, name, exercises, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading templates:', error)
        return
      }

      console.log('Templates found:', templatesData)
      setTemplates(templatesData || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setTemplatesLoading(false)
    }
  }

  const loadHiddenTemplates = async (userId: string) => {
    try {
      // Load hidden templates from user_profiles
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('hidden_templates')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading hidden templates:', error)
        return
      }

      if (profile?.hidden_templates) {
        setHiddenTemplates(new Set(profile.hidden_templates))
      }
    } catch (error) {
      console.error('Error loading hidden templates:', error)
    }
  }

  const toggleTemplateVisibility = async (templateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newHiddenTemplates = new Set(hiddenTemplates)
      if (newHiddenTemplates.has(templateId)) {
        newHiddenTemplates.delete(templateId)
      } else {
        newHiddenTemplates.add(templateId)
      }

      setHiddenTemplates(newHiddenTemplates)

      // Update the hidden_templates field in user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          hidden_templates: Array.from(newHiddenTemplates)
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating hidden templates:', error)
        // Revert the state if update failed
        setHiddenTemplates(hiddenTemplates)
      }
    } catch (error) {
      console.error('Error toggling template visibility:', error)
      // Revert the state if update failed
      setHiddenTemplates(hiddenTemplates)
    }
  }

  return (
    <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black">
      {/* Profile Picture */}
      <div className="mb-6">
        <ProfilePicture
          pictureUrl={profilePictureUrl}
          size="xl"
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

      {/* Privacy Status */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {templatesPrivate ? 'Private Profile' : 'Public Profile'}
      </div>

      {/* Templates Section */}
      {templates.length > 0 && (
        <div className="w-full max-w-4xl px-4">
          <div className="flex items-center gap-2 mb-6">
            <Dumbbell className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Workout Templates</h2>
          </div>

          {templatesLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading templates...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => {
                const isHidden = hiddenTemplates.has(template.id)
                return (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isHidden 
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`font-medium ${isHidden ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {template.name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTemplateVisibility(template.id)}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title={isHidden ? "Show template" : "Hide template"}
                      >
                        {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {/* Exercise List */}
                    <div className="space-y-2 mb-3">
                      {template.exercises?.map((exercise: any, index: number) => (
                        <div key={index} className="text-sm">
                          <div className={`font-medium ${isHidden ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {exercise.name}
                          </div>
                          <div className={`${isHidden ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                            {exercise.sets || 0} sets
                            {exercise.reps && ` × ${exercise.reps} reps`}
                            {exercise.weight && ` @ ${exercise.weight}lbs`}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className={`text-xs border-t pt-2 ${
                      isHidden 
                        ? 'text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600' 
                        : 'text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                    }`}>
                      Created {new Date(template.created_at).toLocaleDateString()}
                      {isHidden && <span className="ml-2">(Hidden)</span>}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
