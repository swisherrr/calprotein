"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCustomExercises } from '@/hooks/use-custom-exercises'

const MUSCLE_GROUPS = [
  "Chest",
  "Back", 
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Cardio",
  "Other"
]

export function CustomExerciseManager() {
  const { customExercises, addCustomExercise, deleteCustomExercise, loading } = useCustomExercises()
  const [showAddForm, setShowAddForm] = useState(false)
  const [exerciseName, setExerciseName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this custom exercise?')) {
      try {
        await deleteCustomExercise(id)
      } catch (error) {
        console.error('Error deleting custom exercise:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!exerciseName.trim() || !muscleGroup) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await addCustomExercise(exerciseName.trim(), muscleGroup)
      setExerciseName('')
      setMuscleGroup('')
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding custom exercise:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading custom exercises...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Custom Exercises</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your custom exercises that aren't in the default list
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
        >
          Add Custom Exercise
        </Button>
      </div>

      {/* Add Custom Exercise Form */}
      {showAddForm && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
            Add Custom Exercise
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="w-full rounded-md border border-blue-300 dark:border-blue-600 px-3 py-2 bg-white dark:bg-black text-blue-900 dark:text-blue-100 text-sm"
                  placeholder="e.g., Custom Deadlift"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Muscle Group
                </label>
                <select
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value)}
                  className="w-full rounded-md border border-blue-300 dark:border-blue-600 px-3 py-2 bg-white dark:bg-black text-blue-900 dark:text-blue-100 text-sm"
                  required
                >
                  <option value="">Select group</option>
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  setExerciseName('')
                  setMuscleGroup('')
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={isSubmitting || !exerciseName.trim() || !muscleGroup}
                className="text-xs"
              >
                {isSubmitting ? 'Adding...' : 'Add Exercise'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {customExercises.length === 0 ? (
        <div className="text-center py-8 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">💪</span>
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">No custom exercises yet</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add your own exercises to track them in your workouts
          </p>
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
          >
            Add Your First Exercise
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {customExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg"
            >
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {exercise.exercise_name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {exercise.muscle_group}
                </p>
              </div>
              <Button
                onClick={() => handleDelete(exercise.id)}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 