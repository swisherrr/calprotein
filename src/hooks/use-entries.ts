import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDemo } from '@/components/providers/demo-provider'

export type Entry = {
  id: number
  name: string
  calories: number
  protein: number
  created_at: string
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const { isDemoMode, demoData, updateDemoData } = useDemo()

  useEffect(() => {
    if (isDemoMode) {
      setEntries(demoData.entries)
      setLoading(false)
    } else {
      fetchEntries()
    }
  }, [isDemoMode, demoData.entries])

  const fetchEntries = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { data: entries, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })

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
  }

  const addEntry = async (entry: Omit<Entry, 'id' | 'created_at' | 'user_id'>) => {
    if (isDemoMode) {
      const newEntry = {
        id: Date.now(),
        ...entry,
        created_at: new Date().toISOString()
      }
      
      const updatedEntries = [newEntry, ...demoData.entries]
      updateDemoData({ entries: updatedEntries })
      setEntries(updatedEntries)
      return newEntry
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('entries')
        .insert([{
          ...entry,
          user_id: userData.user.id
        }])
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
  }

  return {
    entries,
    loading,
    addEntry,
    refresh: fetchEntries
  }
} 