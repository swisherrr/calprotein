import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useDemo } from '@/components/providers/demo-provider'

export interface CustomExercise {
  id: string
  exercise_name: string
  muscle_group: string
  created_at: string
}

export function useCustomExercises() {
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([])
  const [loading, setLoading] = useState(true)
  const { isDemoMode, demoData, updateDemoData } = useDemo()

  const loadCustomExercises = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('Loading custom exercises for user:', user.id)

      const { data, error } = await supabase
        .from('user_custom_exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log('Loaded custom exercises:', data)
      setCustomExercises(data || [])
    } catch (error) {
      console.error('Error loading custom exercises:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isDemoMode) {
      setCustomExercises(demoData.customExercises || [])
      setLoading(false)
    } else {
      loadCustomExercises()
    }
  }, [isDemoMode, demoData.customExercises, loadCustomExercises])

  // Add a separate effect to handle authentication changes
  useEffect(() => {
    if (!isDemoMode) {
      loadCustomExercises()
    }
  }, [isDemoMode, loadCustomExercises])

  const addCustomExercise = async (exerciseName: string, muscleGroup: string) => {
    if (isDemoMode) {
      const newExercise: CustomExercise = {
        id: `demo-custom-${Date.now()}`,
        exercise_name: exerciseName,
        muscle_group: muscleGroup,
        created_at: new Date().toISOString()
      }
      
      const updatedExercises = [newExercise, ...(demoData.customExercises || [])]
      updateDemoData({ customExercises: updatedExercises })
      setCustomExercises(updatedExercises)
      return newExercise
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('user_custom_exercises')
        .insert([{
          user_id: user.id,
          exercise_name: exerciseName,
          muscle_group: muscleGroup
        }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - exercise already exists
          console.log('Custom exercise already exists:', exerciseName)
          // Still refresh to get the existing data
          await loadCustomExercises()
          return null
        }
        throw error
      }
      
      console.log('Added custom exercise:', data)
      
      // Refresh the entire list to ensure consistency
      await loadCustomExercises()
      return data
    } catch (error) {
      console.error('Error adding custom exercise:', error)
      throw error
    }
  }

  const deleteCustomExercise = async (id: string) => {
    if (isDemoMode) {
      const updatedExercises = customExercises.filter(ex => ex.id !== id)
      updateDemoData({ customExercises: updatedExercises })
      setCustomExercises(updatedExercises)
      return
    }

    try {
      const { error } = await supabase
        .from('user_custom_exercises')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting custom exercise:', error)
        throw error
      }
      
      console.log('Deleted custom exercise with id:', id)
      
      // Refresh the entire list to ensure consistency
      await loadCustomExercises()
    } catch (error) {
      console.error('Error deleting custom exercise:', error)
      throw error
    }
  }

  return {
    customExercises,
    loading,
    addCustomExercise,
    deleteCustomExercise,
    refresh: loadCustomExercises
  }
} 