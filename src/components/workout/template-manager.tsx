"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { EXERCISE_GROUPS } from "@/lib/exercises"
import { useWorkoutTemplates, WorkoutTemplate } from "@/hooks/use-workout-templates"
import { useDemo } from "@/components/providers/demo-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Exercise {
  name: string
  sets: number
  setData: any[]
}

export function TemplateManager() {
  const { isDemoMode } = useDemo()
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } = useWorkoutTemplates()
  const [isEditing, setIsEditing] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<WorkoutTemplate>({
    name: "",
    exercises: [],
    user_id: ""
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)



  const handleAddExercise = () => {
    setCurrentTemplate(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: "", sets: 0, setData: [] }]
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

      await addTemplate(templateToSave)
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
      await updateTemplate(currentTemplate)
      setCurrentTemplate({ name: "", exercises: [], user_id: "" })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    try {
      await deleteTemplate(templateToDelete)
      setDeleteConfirmOpen(false)
      setTemplateToDelete(null)
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {currentTemplate.id ? 'Edit Template' : 'Create New Template'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {currentTemplate.id ? 'Update your workout template' : 'Design your perfect workout routine'}
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="space-y-4">
                              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={currentTemplate.name}
                    onChange={(e) => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                    placeholder="Enter template name..."
                  />
                </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Exercises</h3>
                {currentTemplate.exercises.map((exercise, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Exercise Name
                        </label>
                        <select
                          value={exercise.name}
                          onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
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
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleAddExercise}
                    variant="outline"
                    className="flex items-center justify-center"
                  >
                    Add Exercise
                  </Button>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={currentTemplate.id ? handleUpdateTemplate : handleSaveTemplate}
                          className="flex items-center justify-center font-medium"
                        >
                          {currentTemplate.id ? 'Update Template' : 'Save Template'}
                        </Button>
                      </TooltipTrigger>
                      {isDemoMode && (
                        <TooltipContent className="bg-black text-white px-4 py-2 text-sm font-medium">
                          <p>Make an account to save templates</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    setCurrentTemplate({ name: "", exercises: [], user_id: "" })
                  }}
                  className="flex items-center justify-center"
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Templates</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Manage and organize your workout templates
        </p>
        <div className="flex justify-center">
          <Button 
            onClick={() => setIsEditing(true)}
            className="font-medium hover:text-gray-700 dark:hover:text-gray-100"
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No templates yet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create your first workout template to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {templates.map((template, index) => (
            <div key={template.id} className="p-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{template.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400">
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
                    <span className="font-medium text-gray-900 dark:text-gray-100">{exercise.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-black px-3 py-1 rounded-full text-sm font-medium">
                      {exercise.sets} sets
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Delete Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setTemplateToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 