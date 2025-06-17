"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface Exercise {
  name: string
  sets: number
}

interface WorkoutTemplate {
  id?: string
  name: string
  exercises: Exercise[]
  user_id: string
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<WorkoutTemplate>({
    name: "",
    exercises: [],
    user_id: ""
  })

  const handleAddExercise = () => {
    setCurrentTemplate(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: "", sets: 0 }]
    }))
  }

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...currentTemplate.exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setCurrentTemplate(prev => ({ ...prev, exercises: newExercises }))
  }

  const handleSaveTemplate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const templateToSave = {
        ...currentTemplate,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('workout_templates')
        .insert([templateToSave])
        .select()

      if (error) throw error

      setTemplates([...templates, data[0]])
      setCurrentTemplate({ name: "", exercises: [], user_id: "" })
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setCurrentTemplate(template)
    setIsEditing(true)
  }

  const handleUpdateTemplate = async () => {
    try {
      const { error } = await supabase
        .from('workout_templates')
        .update(currentTemplate)
        .eq('id', currentTemplate.id)

      if (error) throw error

      setTemplates(templates.map(t => 
        t.id === currentTemplate.id ? currentTemplate : t
      ))
      setCurrentTemplate({ name: "", exercises: [], user_id: "" })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Workout Templates</h2>
        <Button onClick={() => setIsEditing(true)}>
          Create New Template
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Template Name</label>
            <input
              type="text"
              value={currentTemplate.name}
              onChange={(e) => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-md border border-gray-200 px-3 py-2 !text-gray-900 dark:!text-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
          </div>

          <div className="space-y-4">
            {currentTemplate.exercises.map((exercise, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Exercise</label>
                  <input
                    type="text"
                    value={exercise.name}
                    onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                    className="rounded-md border border-gray-200 px-3 py-2 !text-gray-900 dark:!text-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">Sets</label>
                  <input
                    type="number"
                    value={exercise.sets}
                    onChange={(e) => handleExerciseChange(index, "sets", parseInt(e.target.value))}
                    className="rounded-md border border-gray-200 px-3 py-2 !text-gray-900 dark:!text-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-x-4">
            <Button onClick={handleAddExercise}>
              Add Exercise
            </Button>
            <Button onClick={currentTemplate.id ? handleUpdateTemplate : handleSaveTemplate}>
              {currentTemplate.id ? 'Update Template' : 'Save Template'}
            </Button>
            <Button variant="outline" onClick={() => {
              setIsEditing(false)
              setCurrentTemplate({ name: "", exercises: [], user_id: "" })
            }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium">{template.name}</h3>
                <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                  Edit
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
      )}
    </div>
  )
} 