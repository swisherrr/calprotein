"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

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

export default function WorkoutPage() {
  const [selectedDay, setSelectedDay] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [savedTemplates, setSavedTemplates] = useState<WorkoutTemplate[]>([])
  const [isEditing, setIsEditing] = useState(false)

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ]

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", sets: 0, reps: 0, weight: 0 }])
  }

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setExercises(newExercises)
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
      <h1 className="text-3xl font-bold mb-8">Workout Logger</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Select Day</h2>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => handleLoadTemplate(day)}
              className={`p-4 rounded-lg border text-center transition-colors ${
                selectedDay === day
                  ? "bg-blue-500 text-white border-blue-600"
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
                  <input
                    type="text"
                    placeholder="Exercise name"
                    value={exercise.name}
                    onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                    className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700"
                  />
                  <input
                    type="number"
                    placeholder="Sets"
                    value={exercise.sets}
                    onChange={(e) => handleExerciseChange(index, "sets", parseInt(e.target.value))}
                    className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={exercise.reps}
                    onChange={(e) => handleExerciseChange(index, "reps", parseInt(e.target.value))}
                    className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700"
                  />
                  <input
                    type="number"
                    placeholder="Weight (lbs)"
                    value={exercise.weight}
                    onChange={(e) => handleExerciseChange(index, "weight", parseInt(e.target.value))}
                    className="rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No exercises added yet. Click "Add Exercise" to start.</p>
          )}
        </div>
      )}

      <div className="space-x-4">
        <Button onClick={handleAddExercise}>
          Add Exercise
        </Button>
        {exercises.length > 0 && (
          <Button onClick={handleSaveTemplate}>
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