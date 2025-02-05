import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type UserSettings = {
  daily_calories: number
  daily_protein: number
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>({
    daily_calories: 2000,
    daily_protein: 150
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      let { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userData.user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          // Create default settings for new user
          const { data: newSettings, error: insertError } = await supabase
            .from('user_settings')
            .insert([{
              user_id: userData.user.id,
              daily_calories: 2000,
              daily_protein: 150
            }])
            .select()
            .single()

          if (insertError) throw insertError
          data = newSettings
        } else {
          throw error
        }
      }

      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      // First try to update
      let { data, error } = await supabase
        .from('user_settings')
        .update(newSettings)
        .eq('user_id', userData.user.id)
        .select()
        .single()

      // If no rows updated, insert new settings
      if (error?.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_settings')
          .insert([{
            user_id: userData.user.id,
            daily_calories: 2000,
            daily_protein: 150,
            ...newSettings
          }])
          .select()
          .single()

        if (insertError) throw insertError
        data = newData
      } else if (error) {
        throw error
      }

      setSettings(data)
      return data
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  return {
    settings,
    loading,
    updateSettings
  }
} 