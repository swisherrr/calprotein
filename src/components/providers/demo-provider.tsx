"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DemoData {
  user: {
    id: string
    email: string
    username: string
  }
  entries: any[]
  usuals: any[]
  workoutTemplates: any[]
  workoutLogs: any[]
  customExercises: any[]
  settings: any
}

interface DemoContextType {
  isDemoMode: boolean
  demoData: DemoData
  enterDemoMode: () => void
  exitDemoMode: () => void
  updateDemoData: (data: Partial<DemoData>) => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

const initialDemoData: DemoData = {
  user: {
    id: 'demo-user',
    email: 'demo@gainerithm.com',
    username: 'demo_user'
  },
  entries: [],
  usuals: [
    {
      id: 'demo-usual-1',
      name: 'Chicken Breast',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-usual-2',
      name: 'Oatmeal',
      calories: 150,
      protein: 5,
      carbs: 27,
      fat: 3,
      created_at: new Date().toISOString()
    }
  ],
  workoutTemplates: [
    {
      id: 'demo-template-1',
      name: 'Demo Template',
      user_id: 'demo-user',
      exercises: [
        {
          name: 'Bench Press',
          sets: 3
        },
        {
          name: 'Pull-ups',
          sets: 3
        },
        {
          name: 'Squats',
          sets: 3
        },
        {
          name: 'Overhead Press',
          sets: 3
        }
      ]
    }
  ],
  workoutLogs: [
    {
      id: 'demo-log-1',
      template_id: 'demo-template-1',
      user_id: 'demo-user',
      date: new Date().toISOString().split('T')[0],
      start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      exercises: [
        {
          name: 'Bench Press',
          sets: 4,
          setData: [
            { weight: 135, reps: 10 },
            { weight: 155, reps: 8 },
            { weight: 175, reps: 6 },
            { weight: 185, reps: 4 }
          ],
          volume: 1350
        },
        {
          name: 'Pull-ups',
          sets: 3,
          setData: [
            { weight: 0, reps: 8 },
            { weight: 0, reps: 6 },
            { weight: 0, reps: 5 }
          ],
          volume: 0
        },
        {
          name: 'Squats',
          sets: 4,
          setData: [
            { weight: 185, reps: 8 },
            { weight: 205, reps: 6 },
            { weight: 225, reps: 4 },
            { weight: 245, reps: 2 }
          ],
          volume: 1680
        },
        {
          name: 'Overhead Press',
          sets: 3,
          setData: [
            { weight: 95, reps: 8 },
            { weight: 105, reps: 6 },
            { weight: 115, reps: 4 }
          ],
          volume: 570
        }
      ]
    }
  ],
  customExercises: [
    {
      id: 'demo-custom-1',
      exercise_name: 'Custom Deadlift',
      muscle_group: 'Legs',
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-custom-2',
      exercise_name: 'Custom Push-ups',
      muscle_group: 'Chest',
      created_at: new Date().toISOString()
    }
  ],
  settings: {
    calorie_goal: 2000,
    protein_goal: 150,
    carbs_goal: 200,
    fat_goal: 70,
    auto_load_reps: false,
    auto_load_weight: false
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoData, setDemoData] = useState<DemoData>(initialDemoData)

  const enterDemoMode = () => {
    setIsDemoMode(true)
    // Store demo mode in session storage so it persists during navigation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('demoMode', 'true')
      // Set cookie for middleware to check
      document.cookie = 'demo-mode=true; path=/; max-age=86400; samesite=lax'
    }
  }

  const exitDemoMode = () => {
    setIsDemoMode(false)
    setDemoData(initialDemoData)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('demoMode')
      // Remove demo mode cookie
      document.cookie = 'demo-mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }

  const updateDemoData = (data: Partial<DemoData>) => {
    setDemoData(prev => ({ ...prev, ...data }))
  }

  // Check for demo mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const demoMode = sessionStorage.getItem('demoMode')
      const demoCookie = document.cookie.includes('demo-mode=true')
      if (demoMode === 'true' || demoCookie) {
        setIsDemoMode(true)
        // Ensure cookie is set if only session storage exists
        if (!demoCookie) {
          document.cookie = 'demo-mode=true; path=/; max-age=86400; samesite=lax'
        }
      }
    }
  }, [])

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoData,
      enterDemoMode,
      exitDemoMode,
      updateDemoData
    }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider')
  }
  return context
} 