import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Usual = {
  id: number
  name: string
  portion: string
  calories: number
  protein: number
  created_at: string
}

export function useUsuals() {
  const [usuals, setUsuals] = useState<Usual[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsuals()
  }, [])

  const fetchUsuals = async () => {
    try {
      const { data, error } = await supabase
        .from('usuals')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setUsuals(data || [])
    } catch (error) {
      console.error('Error fetching usuals:', error)
    } finally {
      setLoading(false)
    }
  }

  const addUsual = async (usual: Omit<Usual, 'id' | 'created_at' | 'user_id'>) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('usuals')
        .insert([{
          ...usual,
          user_id: userData.user.id
        }])
        .select()
        .single()

      if (error) throw error
      setUsuals(prev => [...prev, data])
      return data
    } catch (error) {
      console.error('Error adding usual:', error)
      throw error
    }
  }

  const deleteUsual = async (id: number) => {
    try {
      const { error } = await supabase
        .from('usuals')
        .delete()
        .eq('id', id)

      if (error) throw error
      setUsuals(prev => prev.filter(usual => usual.id !== id))
    } catch (error) {
      console.error('Error deleting usual:', error)
      throw error
    }
  }

  return {
    usuals,
    loading,
    addUsual,
    deleteUsual,
    refresh: fetchUsuals
  }
} 