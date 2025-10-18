import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDemo } from '@/components/providers/demo-provider'

export type UserSettings = {
  daily_calories: number
  daily_protein: number
  auto_load_reps: boolean
  auto_load_weight: boolean
  display_workout_average: boolean
  dashboard_reset_hour: number
  rest_timer_duration: number // in seconds
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>({
    daily_calories: 2000,
    daily_protein: 150,
    auto_load_reps: false,
    auto_load_weight: false,
    display_workout_average: true,
    dashboard_reset_hour: 0,
    rest_timer_duration: 120 // default 2 minutes
  })
  const [loading, setLoading] = useState(true)
  const { isDemoMode, demoData, updateDemoData } = useDemo()

  useEffect(() => {
    if (isDemoMode) {
      setSettings({
        daily_calories: demoData.settings.calorie_goal,
        daily_protein: demoData.settings.protein_goal,
        auto_load_reps: demoData.settings.auto_load_reps || false,
        auto_load_weight: demoData.settings.auto_load_weight || false,
        display_workout_average: demoData.settings.display_workout_average !== undefined ? demoData.settings.display_workout_average : true,
        dashboard_reset_hour: demoData.settings.dashboard_reset_hour || 0,
        rest_timer_duration: demoData.settings.rest_timer_duration || 120
      })
      setLoading(false)
    } else {
      fetchSettings()
    }
  }, [isDemoMode, demoData.settings])

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
              daily_protein: 150,
              auto_load_reps: false,
              auto_load_weight: false,
              display_workout_average: true,
              dashboard_reset_hour: 0,
              rest_timer_duration: 120
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
    if (isDemoMode) {
      const updatedSettings = {
        daily_calories: newSettings.daily_calories ?? settings.daily_calories,
        daily_protein: newSettings.daily_protein ?? settings.daily_protein,
        auto_load_reps: newSettings.auto_load_reps ?? settings.auto_load_reps,
        auto_load_weight: newSettings.auto_load_weight ?? settings.auto_load_weight,
        display_workout_average: newSettings.display_workout_average ?? settings.display_workout_average,
        dashboard_reset_hour: newSettings.dashboard_reset_hour ?? settings.dashboard_reset_hour,
        rest_timer_duration: newSettings.rest_timer_duration ?? settings.rest_timer_duration
      }
      
      updateDemoData({
        settings: {
          ...demoData.settings,
          calorie_goal: updatedSettings.daily_calories,
          protein_goal: updatedSettings.daily_protein
        }
      })
      
      setSettings(updatedSettings)
      return updatedSettings
    }

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
            auto_load_reps: false,
            auto_load_weight: false,
            display_workout_average: true,
            dashboard_reset_hour: 0,
            rest_timer_duration: 120,
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