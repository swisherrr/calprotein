import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useDemo } from '@/components/providers/demo-provider'

export interface BodyMeasurement {
  id: string
  user_id: string
  measurement_date: string
  weight_lbs?: number
  bicep_circumference_inches?: number
  chest_circumference_inches?: number
  waist_circumference_inches?: number
  hip_circumference_inches?: number
  thigh_circumference_inches?: number
  calf_circumference_inches?: number
  body_fat_percentage?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface BodyMeasurementInput {
  measurement_date: string
  weight_lbs?: number
  bicep_circumference_inches?: number
  chest_circumference_inches?: number
  waist_circumference_inches?: number
  hip_circumference_inches?: number
  thigh_circumference_inches?: number
  calf_circumference_inches?: number
  body_fat_percentage?: number
  notes?: string
}

export function useBodyMeasurements() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const { isDemoMode, demoData, updateDemoData } = useDemo()

  useEffect(() => {
    if (isDemoMode) {
      setMeasurements(demoData.bodyMeasurements || [])
      setLoading(false)
    } else {
      loadMeasurements()
    }
  }, [isDemoMode, demoData.bodyMeasurements])

  const loadMeasurements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('measurement_date', { ascending: false })
        .limit(100) // Limit to recent 100 measurements for performance

      if (error) throw error
      setMeasurements(data || [])
    } catch (error) {
      console.error('Error loading body measurements:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMeasurement = async (measurement: BodyMeasurementInput) => {
    if (isDemoMode) {
      const newMeasurement: BodyMeasurement = {
        id: `demo-measurement-${Date.now()}`,
        user_id: 'demo-user',
        ...measurement,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const updatedMeasurements = [newMeasurement, ...(demoData.bodyMeasurements || [])]
      updateDemoData({ bodyMeasurements: updatedMeasurements })
      setMeasurements(updatedMeasurements)
      return newMeasurement
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('body_measurements')
        .insert([{ ...measurement, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      setMeasurements(prev => [data, ...prev])
      return data
    } catch (error) {
      console.error('Error adding body measurement:', error)
      throw error
    }
  }

  const updateMeasurement = async (id: string, updates: Partial<BodyMeasurementInput>) => {
    if (isDemoMode) {
      const updatedMeasurements = (demoData.bodyMeasurements || []).map(measurement =>
        measurement.id === id
          ? { ...measurement, ...updates, updated_at: new Date().toISOString() }
          : measurement
      )
      updateDemoData({ bodyMeasurements: updatedMeasurements })
      setMeasurements(updatedMeasurements)
      return updatedMeasurements.find(m => m.id === id)
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('body_measurements')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      setMeasurements(prev => prev.map(m => m.id === id ? data : m))
      return data
    } catch (error) {
      console.error('Error updating body measurement:', error)
      throw error
    }
  }

  const deleteMeasurement = async (id: string) => {
    if (isDemoMode) {
      const updatedMeasurements = (demoData.bodyMeasurements || []).filter(m => m.id !== id)
      updateDemoData({ bodyMeasurements: updatedMeasurements })
      setMeasurements(updatedMeasurements)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('body_measurements')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      setMeasurements(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error deleting body measurement:', error)
      throw error
    }
  }

  const getMeasurementByDate = (date: string) => {
    return measurements.find(m => m.measurement_date === date)
  }

  const getLatestMeasurement = () => {
    return measurements.length > 0 ? measurements[0] : null
  }

  return {
    measurements,
    loading,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    getMeasurementByDate,
    getLatestMeasurement,
    refresh: loadMeasurements
  }
}
