import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

  useEffect(() => {
    fetchEntries()
  }, [])

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

      console.log('Fetched entries:', entries)
      setEntries(entries || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const addEntry = async (entry: Omit<Entry, 'id' | 'created_at' | 'user_id'>) => {
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

      console.log('Added entry:', data)
      setEntries(prev => [data, ...prev])
      await fetchEntries() // Refresh the entries after adding
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