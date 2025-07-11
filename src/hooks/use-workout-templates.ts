import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDemo } from '@/components/providers/demo-provider'

export interface Exercise {
  name: string
  sets: number
  setData: any[]
}

export interface WorkoutTemplate {
  id?: string
  name: string
  exercises: Exercise[]
  user_id: string
}

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const { isDemoMode, demoData, updateDemoData } = useDemo()

  useEffect(() => {
    if (isDemoMode) {
      setTemplates(demoData.workoutTemplates)
      setLoading(false)
    } else {
      loadTemplates()
    }
  }, [isDemoMode, demoData.workoutTemplates])

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTemplate = async (template: Omit<WorkoutTemplate, 'id'>) => {
    if (isDemoMode) {
      const newTemplate = {
        ...template,
        id: `demo-template-${Date.now()}`
      }
      
      const updatedTemplates = [...demoData.workoutTemplates, newTemplate]
      updateDemoData({ workoutTemplates: updatedTemplates })
      setTemplates(updatedTemplates)
      return newTemplate
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('workout_templates')
        .insert([template])
        .select()
        .single()

      if (error) throw error
      setTemplates(prev => [...prev, data])
      return data
    } catch (error) {
      console.error('Error adding template:', error)
      throw error
    }
  }

  const updateTemplate = async (template: WorkoutTemplate) => {
    if (isDemoMode) {
      const updatedTemplates = demoData.workoutTemplates.map(t => 
        t.id === template.id ? template : t
      )
      updateDemoData({ workoutTemplates: updatedTemplates })
      setTemplates(updatedTemplates)
      return template
    }

    try {
      const { error } = await supabase
        .from('workout_templates')
        .update(template)
        .eq('id', template.id)

      if (error) throw error
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
      return template
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (isDemoMode) {
      const updatedTemplates = demoData.workoutTemplates.filter(t => t.id !== templateId)
      updateDemoData({ workoutTemplates: updatedTemplates })
      setTemplates(updatedTemplates)
      return
    }

    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      setTemplates(prev => prev.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    refresh: loadTemplates
  }
} 