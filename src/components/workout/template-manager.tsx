"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { EXERCISE_GROUPS } from "@/lib/exercises"

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
      await loadTemplates()
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
      await loadTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      await loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  if (isEditing) {
    return (
      <div className="animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            {currentTemplate.id ? 'Edit Template' : 'Create New Template'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-light">
            {currentTemplate.id ? 'Update your workout template' : 'Design your perfect workout routine'}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="card-apple">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={currentTemplate.name}
                  onChange={(e) => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="input-apple"
                  placeholder="Enter template name..."
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Exercises</h3>
                {currentTemplate.exercises.map((exercise, index) => (
                  <div key={index} className="card-apple bg-gray-50 dark:bg-gray-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Exercise Name
                        </label>
                        <select
                          value={exercise.name}
                          onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                          className="input-apple"
                        >
                          <option value="">Select exercise</option>
                          {EXERCISE_GROUPS.map((group) => (
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sets
                        </label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleExerciseChange(index, "sets", parseInt(e.target.value))}
                          className="input-apple"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={handleAddExercise}
                  className="btn-apple-outline flex items-center justify-center"
                >
                  Add Exercise
                </Button>
                <Button 
                  onClick={currentTemplate.id ? handleUpdateTemplate : handleSaveTemplate}
                  className="btn-apple flex items-center justify-center"
                >
                  {currentTemplate.id ? 'Update Template' : 'Save Template'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    setCurrentTemplate({ name: "", exercises: [], user_id: "" })
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 flex items-center justify-center"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-semibold mb-4">Your Templates</h2>
        <p className="text-gray-600 dark:text-gray-400 font-light mb-8">
          Manage and organize your workout templates
        </p>
        <div className="flex justify-center">
          <Button 
            onClick={() => setIsEditing(true)}
            className="btn-apple text-lg px-8 py-4 flex items-center justify-center"
          >
            Create New Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-gray-600 dark:text-gray-400 font-light">
            Create your first workout template to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-6 max-w-4xl mx-auto">
          {templates.map((template, index) => (
            <div key={template.id} className="card-apple animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 font-light">
                    {template.exercises.length} exercises
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleEditTemplate(template)}
                    className="text-sm px-4 py-2 flex items-center justify-center"
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDeleteTemplate(template.id!)}
                    className="text-sm px-4 py-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 flex items-center justify-center"
                  >
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {template.exercises.map((exercise, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                    <span className="font-medium">{exercise.name}</span>
                    <span className="text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {exercise.sets} sets
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 