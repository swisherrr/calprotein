"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface Exercise {
  name: string
  sets: number
  reps?: number
  weight?: number
  notes?: string
}

interface WorkoutTemplate {
  id: string
  name: string
  exercises: Exercise[]
  user_id: string
}

interface WorkoutLog {
  id?: string
  template_id: string
  user_id: string
  date: string
  start_time: string
  end_time: string
  exercises: Exercise[]
}

export function WorkoutLogger() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null)
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutLog | null>(null)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

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
    }
  }

  const startWorkout = (template: WorkoutTemplate) => {
    const now = new Date()
    setCurrentWorkout({
      template_id: template.id,
      user_id: template.user_id,
      date: now.toISOString().split('T')[0],
      start_time: now.toISOString(),
      end_time: '',
      exercises: template.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets
      }))
    })
    setSelectedTemplate(template)
    setIsWorkoutActive(true)
  }

  const handleExerciseUpdate = (index: number, field: keyof Exercise, value: string | number) => {
    if (!currentWorkout) return

    const newExercises = [...currentWorkout.exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setCurrentWorkout({ ...currentWorkout, exercises: newExercises })
  }

  const finishWorkout = async () => {
    if (!currentWorkout) return

    try {
      const now = new Date()
      const workoutToSave = {
        ...currentWorkout,
        end_time: now.toISOString()
      }

      const { error } = await supabase
        .from('workout_logs')
        .insert([workoutToSave])

      if (error) throw error

      setCurrentWorkout(null)
      setSelectedTemplate(null)
      setIsWorkoutActive(false)
    } catch (error) {
      console.error('Error saving workout:', error)
    }
  }

  if (isWorkoutActive && currentWorkout) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Current Workout: {selectedTemplate?.name}</h2>
          <Button onClick={finishWorkout}>
            Finish Workout
          </Button>
        </div>

        <div className="space-y-4">
          {currentWorkout.exercises.map((exercise, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Exercise</label>
                <div className="text-gray-900 dark:text-gray-100">{exercise.name}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Sets</label>
                <input
                  type="number"
                  value={exercise.sets}
                  onChange={(e) => handleExerciseUpdate(index, "sets", parseInt(e.target.value))}
                  className="rounded-md border border-gray-200 px-3 py-2 !text-gray-900 dark:!text-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Reps</label>
                <input
                  type="number"
                  value={exercise.reps || ''}
                  onChange={(e) => handleExerciseUpdate(index, "reps", parseInt(e.target.value))}
                  className="rounded-md border border-gray-200 px-3 py-2 !text-gray-900 dark:!text-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Weight (lbs)</label>
                <input
                  type="number"
                  value={exercise.weight || ''}
                  onChange={(e) => handleExerciseUpdate(index, "weight", parseInt(e.target.value))}
                  className="rounded-md border border-gray-200 px-3 py-2 !text-gray-900 dark:!text-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="col-span-4 space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Notes</label>
                <input
                  type="text"
                  value={exercise.notes || ''}
                  onChange={(e) => handleExerciseUpdate(index, "notes", e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 !text-gray-900 dark:!text-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Start a Workout</h2>
      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium">{template.name}</h3>
              <Button onClick={() => startWorkout(template)}>
                Start Workout
              </Button>
            </div>
            <ul className="text-sm space-y-2">
              {template.exercises.map((exercise, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <span>{exercise.name}</span>
                  <span className="text-gray-500">{exercise.sets} sets</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
} 