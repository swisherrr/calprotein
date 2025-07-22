"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { EXERCISE_GROUPS, getCombinedExerciseGroups } from "@/lib/exercises"
import { useWorkoutTemplates, WorkoutTemplate } from "@/hooks/use-workout-templates"
import { useCustomExercises } from "@/hooks/use-custom-exercises"
import { useDemo } from "@/components/providers/demo-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { StarFilledIcon } from '@radix-ui/react-icons';
import { ChevronLeftIcon } from '@radix-ui/react-icons';
import { CustomExerciseManager } from './custom-exercise-manager';

interface Exercise {
  name: string
  sets: number
  setData: any[]
}

const MUSCLE_GROUPS = [
  "Upper Chest",
  "Middle Chest",
  "Lower Chest",
  "Lats",
  "Upper Back",
  "Lower Back",
  "Traps",
  "Shoulders",
  "Bicep",
  "Tricep",
  "Forearm",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Adductors",
  "Abductors",
  "Calves",
  "Core",
  "Cardio",
  "Other"
]

// Helper to get label for current value
const getExerciseLabel = (value: string, customExercises: any[]) => {
  if (!value) return 'Select exercise';
  if (value === 'custom') return 'Add Custom Exercise';
  // Search in all groups
  const allGroups = getCombinedExerciseGroups(customExercises);
  for (const group of allGroups) {
    if (group.exercises.includes(value)) return value;
  }
  return value;
};
const getMuscleGroupLabel = (value: string) => value || 'Select group';

export function TemplateManager() {
  const { isDemoMode } = useDemo()
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } = useWorkoutTemplates()
  const { customExercises, addCustomExercise } = useCustomExercises()
  const [isEditing, setIsEditing] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<WorkoutTemplate>({
    name: "",
    exercises: [],
    user_id: ""
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  const [customExerciseIndex, setCustomExerciseIndex] = useState<number | null>(null)
  const [customExerciseName, setCustomExerciseName] = useState("")
  const [customMuscleGroup, setCustomMuscleGroup] = useState("")
  const [showCustomExerciseManager, setShowCustomExerciseManager] = useState(false);

  const handleAddExercise = () => {
    setCurrentTemplate(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: "", sets: 0, setData: [] }]
    }))
  }

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    console.log('handleExerciseChange called:', { index, field, value, valueType: typeof value })
    
    const newExercises = [...currentTemplate.exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setCurrentTemplate(prev => ({ ...prev, exercises: newExercises }))
  }

  const handleCustomExerciseSubmit = async (index: number) => {
    if (!customExerciseName.trim() || !customMuscleGroup) {
      return
    }

    try {
      await addCustomExercise(customExerciseName.trim(), customMuscleGroup)
      
      // Update the exercise name in the current template
      const newExercises = [...currentTemplate.exercises]
      newExercises[index] = { 
        ...newExercises[index], 
        name: customExerciseName.trim()
      }
      setCurrentTemplate(prev => ({ ...prev, exercises: newExercises }))
      
      // Reset custom exercise form
      setCustomExerciseIndex(null)
      setCustomExerciseName("")
      setCustomMuscleGroup("")
    } catch (error) {
      console.error('Error adding custom exercise:', error)
    }
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
            {currentTemplate.id ? 'Update your workout template' : 'Create a new workout template to save and reuse'}
          </p>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <div className="space-y-6">
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
                      <Select.Root value={exercise.name} onValueChange={(value) => {
                        if (value === 'custom') {
                          setCustomExerciseIndex(index);
                          setCustomExerciseName("");
                          setCustomMuscleGroup("");
                        } else {
                          handleExerciseChange(index, "name", value);
                          if (customExerciseIndex === index) setCustomExerciseIndex(null);
                        }
                      }}>
                        <Select.Trigger className="min-w-[300px] w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-between">
                          <Select.Value placeholder="Select exercise">{getExerciseLabel(exercise.name, customExercises)}</Select.Value>
                          <Select.Icon>
                            <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Content position="popper" sideOffset={4} className="z-50 min-w-[300px] bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
                          <Select.Viewport>
                            <Select.Item value="custom" className="px-3 py-2 cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">Add Custom Exercise</Select.Item>
                            {getCombinedExerciseGroups(customExercises).map((group) => (
                              <Select.Group key={group.label}>
                                <Select.Label className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{group.label}</Select.Label>
                                {group.exercises.map((exerciseName) => {
                                  const isCustom = customExercises.some(ex => ex.exercise_name === exerciseName);
                                  return (
                                    <Select.Item key={exerciseName} value={exerciseName} className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between">
                                      <span>{exerciseName}</span>
                                      {isCustom && <StarFilledIcon className="ml-2 h-4 w-4 text-yellow-400" />}
                                    </Select.Item>
                                  );
                                })}
                              </Select.Group>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Root>
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

                  {/* Custom Exercise Form - Inline */}
                  {customExerciseIndex === index && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
                          <Select.Root value={customMuscleGroup} onValueChange={setCustomMuscleGroup}>
                            <Select.Trigger className="min-w-[300px] w-full rounded-md border border-blue-300 dark:border-blue-600 px-3 py-2 bg-white dark:bg-black text-blue-900 dark:text-blue-100 text-sm flex items-center justify-between">
                              <Select.Value placeholder="Select group">{getMuscleGroupLabel(customMuscleGroup)}</Select.Value>
                              <Select.Icon>
                                <ChevronDownIcon className="ml-2 h-4 w-4 text-blue-400" />
                              </Select.Icon>
                            </Select.Trigger>
                            <Select.Content position="popper" sideOffset={4} className="z-50 min-w-[300px] bg-white dark:bg-black border border-blue-300 dark:border-blue-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
                              <Select.Viewport>
                                {MUSCLE_GROUPS.map((group) => (
                                  <Select.Item key={group} value={group} className="px-3 py-2 cursor-pointer text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/20">
                                    {group}
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Root>
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
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <Button 
                onClick={handleAddExercise}
                variant="outline"
                className="flex items-center justify-center w-full"
              >
                Add Exercise
              </Button>
              
              <div className="flex justify-between items-center gap-4">
                <Button 
                  onClick={() => {
                    setIsEditing(false)
                    setCurrentTemplate({ name: "", exercises: [], user_id: "" })
                  }}
                  className="flex items-center justify-center"
                >
                  Cancel
                </Button>
                
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={currentTemplate.id ? handleUpdateTemplate : handleSaveTemplate}
                        variant="outline"
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Workout Templates</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Manage and organize your workout templates
        </p>
        <div className="flex justify-center gap-4 mb-8">
          <Button onClick={() => setIsEditing(true)} className="font-medium hover:text-gray-700 dark:hover:text-gray-100">
            Create New Template
          </Button>
          <Button onClick={() => setShowCustomExerciseManager(true)} className="font-medium hover:text-gray-700 dark:hover:text-gray-100">
            Manage Custom Exercises
          </Button>
        </div>
      </div>

      {showCustomExerciseManager ? (
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-4">
            <Button onClick={() => setShowCustomExerciseManager(false)} className="font-medium hover:text-gray-700 dark:hover:text-gray-100">
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Manage Custom Exercises</h2>
          </div>
          <CustomExerciseManager />
        </div>
      ) : isEditing ? (
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {currentTemplate.id ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {currentTemplate.id ? 'Update your workout template' : 'Create a new workout template to save and reuse'}
            </p>
          </div>

          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="space-y-6">
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
                        <Select.Root value={exercise.name} onValueChange={(value) => {
                          if (value === 'custom') {
                            setCustomExerciseIndex(index);
                            setCustomExerciseName("");
                            setCustomMuscleGroup("");
                          } else {
                            handleExerciseChange(index, "name", value);
                            if (customExerciseIndex === index) setCustomExerciseIndex(null);
                          }
                        }}>
                          <Select.Trigger className="min-w-[300px] w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-between">
                            <Select.Value placeholder="Select exercise">{getExerciseLabel(exercise.name, customExercises)}</Select.Value>
                            <Select.Icon>
                              <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Content position="popper" sideOffset={4} className="z-50 min-w-[300px] bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
                            <Select.Viewport>
                              <Select.Item value="custom" className="px-3 py-2 cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">Add Custom Exercise</Select.Item>
                              {getCombinedExerciseGroups(customExercises).map((group) => (
                                <Select.Group key={group.label}>
                                  <Select.Label className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{group.label}</Select.Label>
                                  {group.exercises.map((exerciseName) => {
                                    const isCustom = customExercises.some(ex => ex.exercise_name === exerciseName);
                                    return (
                                      <Select.Item key={exerciseName} value={exerciseName} className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between">
                                        <span>{exerciseName}</span>
                                        {isCustom && <StarFilledIcon className="ml-2 h-4 w-4 text-yellow-400" />}
                                      </Select.Item>
                                    );
                                  })}
                                </Select.Group>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Root>
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

                    {/* Custom Exercise Form - Inline */}
                    {customExerciseIndex === index && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
                            <Select.Root value={customMuscleGroup} onValueChange={setCustomMuscleGroup}>
                              <Select.Trigger className="min-w-[300px] w-full rounded-md border border-blue-300 dark:border-blue-600 px-3 py-2 bg-white dark:bg-black text-blue-900 dark:text-blue-100 text-sm flex items-center justify-between">
                                <Select.Value placeholder="Select group">{getMuscleGroupLabel(customMuscleGroup)}</Select.Value>
                                <Select.Icon>
                                  <ChevronDownIcon className="ml-2 h-4 w-4 text-blue-400" />
                                </Select.Icon>
                              </Select.Trigger>
                              <Select.Content position="popper" sideOffset={4} className="z-50 min-w-[300px] bg-white dark:bg-black border border-blue-300 dark:border-blue-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
                                <Select.Viewport>
                                  {MUSCLE_GROUPS.map((group) => (
                                    <Select.Item key={group} value={group} className="px-3 py-2 cursor-pointer text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/20">
                                      {group}
                                    </Select.Item>
                                  ))}
                                </Select.Viewport>
                              </Select.Content>
                            </Select.Root>
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
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <Button 
                  onClick={handleAddExercise}
                  variant="outline"
                  className="flex items-center justify-center w-full"
                >
                  Add Exercise
                </Button>
                
                <div className="flex justify-between items-center gap-4">
                  <Button 
                    onClick={() => {
                      setIsEditing(false)
                      setCurrentTemplate({ name: "", exercises: [], user_id: "" })
                    }}
                    className="flex items-center justify-center"
                  >
                    Cancel
                  </Button>
                  
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={currentTemplate.id ? handleUpdateTemplate : handleSaveTemplate}
                          variant="outline"
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
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No templates yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Create your first workout template to get started
            </p>
          </div>
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