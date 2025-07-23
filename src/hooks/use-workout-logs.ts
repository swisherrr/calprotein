import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDemo } from '@/components/providers/demo-provider'

export interface Set {
  reps?: number
  weight?: number
}

export interface Exercise {
  name: string
  sets: number
  setData: Set[]
  volume?: number
  notes?: string
}

export interface WorkoutLog {
  id?: string
  template_id: string
  user_id: string
  date: string
  start_time: string
  end_time: string
  exercises: Exercise[]
}

export function useWorkoutLogs() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const { isDemoMode, demoData, updateDemoData } = useDemo()

  useEffect(() => {
    if (isDemoMode) {
      setLogs(demoData.workoutLogs)
      setLoading(false)
    } else {
      loadLogs()
    }
  }, [isDemoMode, demoData.workoutLogs])

  const loadLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50) // Limit to recent 50 workout logs for performance

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading workout logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const addLog = async (log: Omit<WorkoutLog, 'id'>) => {
    if (isDemoMode) {
      const newLog = {
        ...log,
        id: `demo-log-${Date.now()}`
      }
      
      const updatedLogs = [newLog, ...demoData.workoutLogs]
      updateDemoData({ workoutLogs: updatedLogs })
      setLogs(updatedLogs)
      return newLog
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('workout_logs')
        .insert([log])
        .select()
        .single()

      if (error) throw error
      setLogs(prev => [data, ...prev])
      return data
    } catch (error) {
      console.error('Error adding workout log:', error)
      throw error
    }
  }

  const updateLog = async (log: WorkoutLog) => {
    if (isDemoMode) {
      const updatedLogs = demoData.workoutLogs.map(l => 
        l.id === log.id ? log : l
      )
      updateDemoData({ workoutLogs: updatedLogs })
      setLogs(updatedLogs)
      return log
    }

    try {
      const { error } = await supabase
        .from('workout_logs')
        .update(log)
        .eq('id', log.id)

      if (error) throw error
      setLogs(prev => prev.map(l => l.id === log.id ? log : l))
      return log
    } catch (error) {
      console.error('Error updating workout log:', error)
      throw error
    }
  }

  const deleteLog = async (logId: string) => {
    if (isDemoMode) {
      const updatedLogs = demoData.workoutLogs.filter(l => l.id !== logId)
      updateDemoData({ workoutLogs: updatedLogs })
      setLogs(updatedLogs)
      return
    }

    try {
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', logId)

      if (error) throw error
      setLogs(prev => prev.filter(l => l.id !== logId))
    } catch (error) {
      console.error('Error deleting workout log:', error)
      throw error
    }
  }

  return {
    logs,
    loading,
    addLog,
    updateLog,
    deleteLog,
    refresh: loadLogs
  }
} 