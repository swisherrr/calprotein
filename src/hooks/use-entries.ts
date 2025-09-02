import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useDemo } from '@/components/providers/demo-provider'

export type Entry = {
  id: number
  name: string
  calories: number
  protein: number
  created_at: string
}

export function useEntries(resetHour: number = 0) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const { isDemoMode, demoData, updateDemoData } = useDemo()

  // Get the current "day" based on user's reset time
  const getCurrentDay = useCallback((date: Date, hour: number) => {
    const currentHour = date.getHours()
    
    // If current time is before reset hour, we're still in "yesterday"
    if (currentHour < hour) {
      const yesterday = new Date(date)
      yesterday.setDate(date.getDate() - 1)
      return yesterday
    }
    
    return date
  }, [])

  const fetchEntries = useCallback(async (date?: Date) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      let query = supabase
        .from('entries')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })

      // If a specific date is provided, filter by that date considering reset time
      if (date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(resetHour, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(resetHour + 23, 59, 59, 999)
        
        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
      }

      const { data: entries, error } = await query

      if (error) {
        console.error('Error fetching entries:', error)
        throw error
      }

      setEntries(entries || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }, [resetHour])

  useEffect(() => {
    if (isDemoMode) {
      setEntries(demoData.entries)
      setLoading(false)
    } else {
      fetchEntries()
    }
  }, [isDemoMode, demoData.entries, fetchEntries])

  const addEntry = useCallback(async (entry: Omit<Entry, 'id' | 'created_at' | 'user_id'>, date?: Date) => {
    if (isDemoMode) {
      const newEntry = {
        id: Date.now(),
        ...entry,
        created_at: date ? date.toISOString() : new Date().toISOString()
      }
      
      const updatedEntries = [newEntry, ...demoData.entries]
      updateDemoData({ entries: updatedEntries })
      setEntries(updatedEntries)
      return newEntry
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const entryData: {
        name: string
        calories: number
        protein: number
        user_id: string
        created_at?: string
      } = {
        ...entry,
        user_id: userData.user.id
      }

      // If a specific date is provided, use that date
      if (date) {
        entryData.created_at = date.toISOString()
      }

      const { data, error } = await supabase
        .from('entries')
        .insert([entryData])
        .select()
        .single()

      if (error) {
        console.error('Error adding entry:', error)
        throw error
      }

      // Update local state immediately
      setEntries(prev => [data, ...prev])
      
      // No need to fetch all entries again
      return data
    } catch (error) {
      console.error('Error adding entry:', error)
      throw error
    }
  }, [isDemoMode, demoData.entries, updateDemoData])

  return {
    entries,
    loading,
    addEntry,
    fetchEntries,
    refresh: fetchEntries
  }
} 