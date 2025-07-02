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
      <div className="container-apple section-apple">
        <div className="animate-fade-in-up">
          <div className="text-center mb-12">
            <h1 className="mb-4">Current Workout</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-light">
              {selectedTemplate?.name}
            </p>
          </div>

          <div className="space-y-6">
            {currentWorkout.exercises.map((exercise, index) => (
              <div key={index} className="card-apple animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold mb-2">{exercise.name}</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Sets</label>
                    <input
                      type="number"
                      value={exercise.sets}
                      onChange={(e) => handleExerciseUpdate(index, "sets", parseInt(e.target.value))}
                      className="input-apple text-center text-lg"
                    />
                  </div>
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Reps</label>
                    <input
                      type="number"
                      value={exercise.reps || ''}
                      onChange={(e) => handleExerciseUpdate(index, "reps", parseInt(e.target.value))}
                      className="input-apple text-center text-lg"
                    />
                  </div>
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Weight</label>
                    <input
                      type="number"
                      value={exercise.weight || ''}
                      onChange={(e) => handleExerciseUpdate(index, "weight", parseInt(e.target.value))}
                      className="input-apple text-center text-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notes</label>
                  <input
                    type="text"
                    value={exercise.notes || ''}
                    onChange={(e) => handleExerciseUpdate(index, "notes", e.target.value)}
                    className="input-apple"
                    placeholder="Add any notes about this exercise..."
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              onClick={finishWorkout} 
              className="btn-apple text-lg px-12 py-4"
            >
              Finish Workout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-apple section-apple">
      <div className="animate-fade-in-up">
        <div className="text-center mb-16">
          <h1 className="mb-4">Start a Workout</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto">
            Choose a workout template to begin your fitness journey
          </p>
        </div>

        <div className="grid gap-8 max-w-4xl mx-auto">
          {templates.map((template, index) => (
            <div key={template.id} className="card-apple animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold mb-4">{template.name}</h3>
                <Button 
                  onClick={() => startWorkout(template)} 
                  className="btn-apple text-lg px-12 py-4"
                >
                  Start Workout
                </Button>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 text-center mb-6">
                  Exercises
                </h4>
                {template.exercises.map((exercise, idx) => (
                  <div key={idx} className="flex justify-between items-center py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                    <span className="text-lg font-medium">{exercise.name}</span>
                    <span className="text-gray-500 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium">
                      {exercise.sets} sets
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 