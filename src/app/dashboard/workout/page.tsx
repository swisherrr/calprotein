"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { EXERCISE_GROUPS, getCombinedExerciseGroups } from "@/lib/exercises"
import { useCustomExercises } from "@/hooks/use-custom-exercises"

interface Exercise {
  name: string
  sets: number
  reps: number
  weight: number
}

interface WorkoutTemplate {
  day: string
  exercises: Exercise[]
}

interface CheckIn {
  weight?: number
  bodyFatPercentage?: number
  chestMeasurement?: number
  waistMeasurement?: number
  hipMeasurement?: number
  armMeasurement?: number
  thighMeasurement?: number
  notes?: string
}

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

export default function WorkoutPage() {
  const { customExercises, addCustomExercise } = useCustomExercises()
  
  // Debug logging
  
  const [selectedDay, setSelectedDay] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [savedTemplates, setSavedTemplates] = useState<WorkoutTemplate[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [checkInData, setCheckInData] = useState<CheckIn>({})
  const [totalVolume, setTotalVolume] = useState(0)
  const [customExerciseIndex, setCustomExerciseIndex] = useState<number | null>(null)
  const [customExerciseName, setCustomExerciseName] = useState("")
  const [customMuscleGroup, setCustomMuscleGroup] = useState("")

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ]

  const calculateVolume = (exercises: Exercise[]) => {
    return exercises.reduce((total, exercise) => {
      return total + (exercise.sets * exercise.reps * exercise.weight)
    }, 0)
  }

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", sets: 0, reps: 0, weight: 0 }])
  }

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    if (field === "name" && value === "custom") {
      // Show custom exercise form inline
      setCustomExerciseIndex(index)
      setCustomExerciseName("")
      setCustomMuscleGroup("")
      return
    }

    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setExercises(newExercises)
    setTotalVolume(calculateVolume(newExercises))
    
    // Hide custom exercise form if it was open
    if (customExerciseIndex === index) {
      setCustomExerciseIndex(null)
    }
  }

  const handleCustomExerciseSubmit = async (index: number) => {
    if (!customExerciseName.trim() || !customMuscleGroup) {
      return
    }

    try {
      await addCustomExercise(customExerciseName.trim(), customMuscleGroup)
      
      // Update the exercise name in the current exercises
      const newExercises = [...exercises]
      newExercises[index] = { 
        ...newExercises[index], 
        name: customExerciseName.trim()
      }
      setExercises(newExercises)
      setTotalVolume(calculateVolume(newExercises))
      
      // Reset custom exercise form
      setCustomExerciseIndex(null)
      setCustomExerciseName("")
      setCustomMuscleGroup("")
    } catch (error) {
      console.error('Error adding custom exercise:', error)
    }
  }

  const handleCheckInChange = (field: keyof CheckIn, value: string | number) => {
    setCheckInData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCheckInSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('check_ins')
        .insert([{
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          ...checkInData
        }])

      if (error) throw error

      setIsCheckInOpen(false)
      setCheckInData({})
    } catch (error) {
      console.error('Error saving check-in:', error)
    }
  }

  const handleSaveTemplate = () => {
    if (!selectedDay) return

    const newTemplate: WorkoutTemplate = {
      day: selectedDay,
      exercises: exercises
    }

    setSavedTemplates([...savedTemplates, newTemplate])
    setIsEditing(false)
  }

  const handleLoadTemplate = (day: string) => {
    const template = savedTemplates.find(t => t.day === day)
    if (template) {
      setExercises(template.exercises)
      setSelectedDay(day)
      setIsEditing(true)
    } else {
      setExercises([])
      setSelectedDay(day)
      setIsEditing(true)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Workout Logger</h1>
        <Button 
          onClick={() => alert('Check In clicked')}
                          className="bg-blue-500 hover:bg-blue-600 pink:bg-pink-600 pink:hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          Check In
        </Button>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Select Day</h2>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => handleLoadTemplate(day)}
              className={`p-4 rounded-lg border text-center transition-colors ${
                selectedDay === day
                  ? "bg-blue-500 text-white border-blue-600 pink:bg-pink-600 pink:border-pink-600"
                  : "bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {selectedDay && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">{selectedDay}'s Workout</h2>
          {exercises.length > 0 ? (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exercise</label>
                    <select
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2"
                    >
                      <option value="">Select exercise</option>
                      <option value="custom">➕ Add Custom Exercise</option>
                      {getCombinedExerciseGroups(customExercises).map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.exercises.map((exerciseName) => (
                            <option key={exerciseName} value={exerciseName}>
                              {exerciseName}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sets</label>
                    <input
                      type="number"
                      value={exercise.sets}
                      onChange={(e) => handleExerciseChange(index, "sets", parseInt(e.target.value))}
                      className="w-full rounded-md border border-gray-200 px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reps</label>
                    <input
                      type="number"
                      value={exercise.reps}
                      onChange={(e) => handleExerciseChange(index, "reps", parseInt(e.target.value))}
                      className="w-full rounded-md border border-gray-200 px-3 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (lbs)</label>
                    <input
                      type="number"
                      value={exercise.weight}
                      onChange={(e) => handleExerciseChange(index, "weight", parseInt(e.target.value))}
                      className="w-full rounded-md border border-gray-200 px-3 py-2"
                    />
                  </div>

                  {/* Custom Exercise Form - Inline */}
                  {customExerciseIndex === index && (
                    <div className="col-span-4 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 pink:bg-pink-50 border border-blue-200 dark:border-blue-800 pink:border-pink-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                        Add Custom Exercise
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Exercise Name
                          </label>
                          <input
                            type="text"
                            value={customExerciseName}
                            onChange={(e) => setCustomExerciseName(e.target.value)}
                            className="w-full rounded-md border border-blue-300 dark:border-blue-600 px-3 py-2 bg-white dark:bg-black text-blue-900 dark:text-blue-100 text-sm"
                            placeholder="e.g., Custom Deadlift"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Muscle Group
                          </label>
                          <select
                            value={customMuscleGroup}
                            onChange={(e) => setCustomMuscleGroup(e.target.value)}
                            className="w-full rounded-md border border-blue-300 dark:border-blue-600 px-3 py-2 bg-white dark:bg-black text-blue-900 dark:text-blue-100 text-sm"
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
                      <div className="flex justify-end gap-2 mt-3">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setCustomExerciseIndex(null)
                            setCustomExerciseName("")
                            setCustomMuscleGroup("")
                          }}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCustomExerciseSubmit(index)}
                          disabled={!customExerciseName.trim() || !customMuscleGroup}
                          className="text-xs"
                        >
                          Add Exercise
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="text-right text-lg font-medium">
                Total Volume: {totalVolume.toLocaleString()} lbs
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No exercises added yet. Click "Add Exercise" to start.</p>
          )}
        </div>
      )}

      <div className="space-x-4">
        <Button onClick={handleAddExercise} className="flex items-center justify-center">
          Add Exercise
        </Button>
        {exercises.length > 0 && (
          <Button onClick={handleSaveTemplate} className="flex items-center justify-center">
            Save Workout Template
          </Button>
        )}
      </div>

      {savedTemplates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Saved Workout Templates</h2>
          <div className="grid grid-cols-2 gap-4">
            {savedTemplates.map((template, index) => (
              <div key={index} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                <h3 className="font-medium mb-2">{template.day}</h3>
                <ul className="text-sm space-y-2">
                  {template.exercises.map((exercise, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{exercise.name}</span>
                      <span className="text-gray-500">
                        {exercise.sets} × {exercise.reps} @ {exercise.weight}lbs
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 