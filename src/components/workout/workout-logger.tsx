"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useDemo } from "@/components/providers/demo-provider"
import { useWorkoutTemplates } from "@/hooks/use-workout-templates"
import { useWorkoutLogs } from "@/hooks/use-workout-logs"
import { useUserSettings } from "@/hooks/use-user-settings"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useCustomExercises } from "@/hooks/use-custom-exercises"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { getCombinedExerciseGroups } from "@/lib/exercises"
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { StarFilledIcon } from '@radix-ui/react-icons';

interface Set {
  reps?: number
  weight?: number
}

interface Exercise {
  name: string
  sets: number
  setData: Set[]
  volume?: number
  notes?: string
}

interface WorkoutTemplate {
  id?: string
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

interface PersonalRecord {
  exercise: string
  maxWeight: number
  maxReps: number
  maxVolume: number
}

interface WorkoutTemplateCardProps {
  template: WorkoutTemplate
  onStartWorkout: (template: WorkoutTemplate) => void
}

const getExerciseLabel = (value: string, customExercises: any[]) => {
  if (!value) return '';
  const isCustom = customExercises.some(ex => ex.exercise_name === value);
  return isCustom ? `${value} ⭐` : value;
};

function WorkoutTemplateCard({ template, onStartWorkout }: WorkoutTemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="p-6 bg-white dark:bg-black pink:bg-pink-50 border border-gray-200 dark:border-gray-800 pink:border-pink-200 rounded-lg">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{template.name}</h3>
        <div className="flex justify-center">
          <Button 
            onClick={() => onStartWorkout(template)} 
            className="font-medium bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-900 dark:hover:bg-blue-800 pink:bg-pink-800 pink:hover:bg-pink-900 rounded-full mt-2"
          >
            Start Workout
          </Button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div 
        className="flex items-center justify-between cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm">View exercises</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </div>
      
      {isExpanded && (
        <div className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 text-center mb-6">
            Exercises
          </h4>
          {template.exercises.map((exercise, idx) => (
            <div key={idx} className="flex justify-between items-center py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">{exercise.name}</span>
              <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-black px-4 py-2 rounded-full text-sm font-medium">
                {exercise.sets} sets
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Timer component
function WorkoutTimer({ startTime, restTimerDuration }: { startTime: string, restTimerDuration: number }) {
  const [elapsed, setElapsed] = useState(0)
  const [isRed, setIsRed] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(startTime).getTime()
      const now = new Date().getTime()
      setElapsed(now - start)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const handleTimerClick = () => {
    setIsRed(true)
    setTimeout(() => {
      setIsRed(false)
    }, restTimerDuration * 1000) // Convert seconds to milliseconds
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    const displaySeconds = seconds % 60
    const displayMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`
    }
    return `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="text-center mb-6">
      <div 
        className={`inline-block rounded-full px-6 py-3 cursor-pointer transition-colors duration-300 ${
          isRed 
            ? 'bg-red-100 dark:bg-red-900' 
            : 'bg-gray-100 dark:bg-gray-800'
        }`}
        onClick={handleTimerClick}
      >
        <span className={`text-2xl font-mono font-bold transition-colors duration-300 ${
          isRed 
            ? 'text-red-800 dark:text-red-200' 
            : 'text-gray-800 dark:text-gray-200'
        }`}>
          {formatTime(elapsed)}
        </span>
      </div>
    </div>
  )
}

export function WorkoutLogger() {
  const { isDemoMode, demoData } = useDemo()
  const { templates, loading: templatesLoading } = useWorkoutTemplates()
  const { logs, addLog } = useWorkoutLogs()
  const { customExercises } = useCustomExercises()
  
  // Use localStorage for persistent workout state
  const [currentWorkout, setCurrentWorkout] = useLocalStorage<WorkoutLog | null>('currentWorkout', null)
  const [selectedTemplate, setSelectedTemplate] = useLocalStorage<WorkoutTemplate | null>('selectedTemplate', null)
  const [isWorkoutActive, setIsWorkoutActive] = useLocalStorage<boolean>('isWorkoutActive', false)
  
  const [lastWorkoutData, setLastWorkoutData] = useState<Record<string, { 
    reps?: number | string, 
    weight?: number | string, 
    volume?: number,
    setData?: Array<{ reps?: number, weight?: number }>
  }>>({})
  const [showSummary, setShowSummary] = useState(false)
  const [workoutSummary, setWorkoutSummary] = useState<{
    totalVolume: number
    duration: string
    personalRecords: PersonalRecord[]
    exerciseStats: Array<{
      name: string
      totalSets: number
      totalReps: number
      totalWeight: number
      maxWeight: number
      maxReps: number
      volume: number
    }>
  } | null>(null)
  const { settings } = useUserSettings()
  const autoLoadReps = settings?.auto_load_reps || false
  const autoLoadWeight = settings?.auto_load_weight || false
  const displayWorkoutAverage = settings?.display_workout_average !== false
  const [postingToProfile, setPostingToProfile] = useState(false)
  const [completedTemplateName, setCompletedTemplateName] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showAddExerciseDialog, setShowAddExerciseDialog] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [newExerciseSets, setNewExerciseSets] = useState<number | string>(1)

  // Set client flag on mount to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check for existing workout on component mount
  useEffect(() => {
    if (currentWorkout && selectedTemplate && isWorkoutActive) {
      // Verify the workout is from today and not too old (within 24 hours)
      const workoutStartTime = new Date(currentWorkout.start_time)
      const now = new Date()
      const hoursSinceStart = (now.getTime() - workoutStartTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceStart > 24) {
        // Workout is too old, clear it
        setCurrentWorkout(null)
        setSelectedTemplate(null)
        setIsWorkoutActive(false)
      } else {
        // Fetch last workout data for the resumed workout
        const exerciseNames = currentWorkout.exercises.map(ex => ex.name)
        fetchLastWorkoutData(exerciseNames)
      }
    }
  }, [])

  const formatLastWorkoutDisplay = (exerciseName: string) => {
    const data = lastWorkoutData[exerciseName]
    if (!data) return null
    
    const repsDisplay = typeof data.reps === 'string' ? data.reps : data.reps
    const weightDisplay = typeof data.weight === 'string' ? data.weight : data.weight
    
    return `${repsDisplay} reps × ${weightDisplay} lbs (${data.volume?.toLocaleString()} lbs total volume)`
  }

  const fetchLastWorkoutData = async (exerciseNames: string[]) => {
    if (isDemoMode) {
      // Use demo workout logs for last workout data
      const lastWorkoutDataMap: Record<string, { 
        reps?: number | string, 
        weight?: number | string, 
        volume?: number,
        setData?: Array<{ reps?: number, weight?: number }>
      }> = {}
      
      for (const exerciseName of exerciseNames) {
        // Find the most recent workout that contains this exercise
        for (const workout of demoData.workoutLogs) {
          const exercise = workout.exercises?.find((ex: any) => ex.name === exerciseName)
          if (exercise && exercise.setData && exercise.setData.length > 0) {
            if (displayWorkoutAverage) {
              // Calculate average reps and weight
              const totalReps = exercise.setData.reduce((sum: number, set: any) => sum + (set.reps || 0), 0)
              const totalWeight = exercise.setData.reduce((sum: number, set: any) => sum + (set.weight || 0), 0)
              const avgReps = totalReps / exercise.setData.length
              const avgWeight = totalWeight / exercise.setData.length
              
              lastWorkoutDataMap[exerciseName] = {
                reps: Math.round(avgReps * 100) / 100,
                weight: Math.round(avgWeight * 100) / 100,
                volume: exercise.volume || 0
              }
            } else {
              // Display individual sets
              const repsList = exercise.setData.map((set: any) => set.reps || 0).join(',')
              const weightList = exercise.setData.map((set: any) => set.weight || 0).join(',')
              
              lastWorkoutDataMap[exerciseName] = {
                reps: repsList,
                weight: weightList,
                volume: exercise.volume || 0,
                setData: exercise.setData
              }
            }
            break
          }
        }
      }
      
      setLastWorkoutData(lastWorkoutDataMap)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all recent workout logs in one query instead of multiple queries
      const { data, error } = await supabase
        .from('workout_logs')
        .select('exercises')
        .eq('user_id', user.id)
        .not('exercises', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20) // Increased limit to find more recent data

      if (error) {
        console.error('Error fetching last workout data:', error)
        return
      }

      const lastWorkoutDataMap: Record<string, { 
        reps?: number | string, 
        weight?: number | string, 
        volume?: number,
        setData?: Array<{ reps?: number, weight?: number }>
      }> = {}
      const foundExercises = new Set<string>()

      // Process all workouts to find the most recent data for each exercise
      for (const workout of data || []) {
        if (foundExercises.size === exerciseNames.length) break // Stop if we found all exercises
        
        for (const exercise of workout.exercises || []) {
          if (foundExercises.has(exercise.name)) continue // Skip if we already found this exercise
          
          if (exercise.setData && exercise.setData.length > 0) {
            // New format: calculate total volume from all sets
            let totalVolume = 0
            let hasValidSets = false
            
            for (const set of exercise.setData) {
              if (set.reps && set.weight) {
                totalVolume += set.reps * set.weight
                hasValidSets = true
              }
            }
            
            if (hasValidSets) {
              if (displayWorkoutAverage) {
                // Calculate average reps and weight
                const totalReps = exercise.setData.reduce((sum: number, set: any) => sum + (set.reps || 0), 0)
                const totalWeight = exercise.setData.reduce((sum: number, set: any) => sum + (set.weight || 0), 0)
                const avgReps = totalReps / exercise.setData.length
                const avgWeight = totalWeight / exercise.setData.length
                
                lastWorkoutDataMap[exercise.name] = {
                  reps: Math.round(avgReps * 100) / 100,
                  weight: Math.round(avgWeight * 100) / 100,
                  volume: totalVolume
                }
              } else {
                // Display individual sets
                const repsList = exercise.setData.map((set: any) => set.reps || 0).join(',')
                const weightList = exercise.setData.map((set: any) => set.weight || 0).join(',')
                
                lastWorkoutDataMap[exercise.name] = {
                  reps: repsList,
                  weight: weightList,
                  volume: totalVolume,
                  setData: exercise.setData
                }
              }
              foundExercises.add(exercise.name)
            }
          } else if (exercise.reps || exercise.weight) {
            // Old format: use the single reps/weight values
            const volume = (exercise.reps || 0) * (exercise.weight || 0)
            lastWorkoutDataMap[exercise.name] = {
              reps: exercise.reps,
              weight: exercise.weight,
              volume: volume
            }
            foundExercises.add(exercise.name)
          }
        }
      }

      setLastWorkoutData(lastWorkoutDataMap)
    } catch (error) {
      console.error('Error fetching last workout data:', error)
    }
  }

  const calculatePersonalRecords = async (exercises: Exercise[]): Promise<PersonalRecord[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('workout_logs')
        .select('exercises')
        .eq('user_id', user.id)
        .not('exercises', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      const records: Record<string, PersonalRecord> = {}

      // Process all historical workouts
      for (const workout of data || []) {
        for (const exercise of workout.exercises || []) {
          const { name, setData } = exercise
          
          // Handle both old and new format
          if (setData && setData.length > 0) {
            // New format: process each set
            for (const set of setData) {
              const { reps = 0, weight = 0 } = set
              const volume = reps * weight

              if (!records[name]) {
                records[name] = {
                  exercise: name,
                  maxWeight: 0,
                  maxReps: 0,
                  maxVolume: 0
                }
              }

              if (weight > records[name].maxWeight) {
                records[name].maxWeight = weight
              }
              if (reps > records[name].maxReps) {
                records[name].maxReps = reps
              }
              if (volume > records[name].maxVolume) {
                records[name].maxVolume = volume
              }
            }
          } else {
            // Old format: use single reps/weight values
            const { reps = 0, weight = 0 } = exercise
            const volume = reps * weight

            if (!records[name]) {
              records[name] = {
                exercise: name,
                maxWeight: 0,
                maxReps: 0,
                maxVolume: 0
              }
            }

            if (weight > records[name].maxWeight) {
              records[name].maxWeight = weight
            }
            if (reps > records[name].maxReps) {
              records[name].maxReps = reps
            }
            if (volume > records[name].maxVolume) {
              records[name].maxVolume = volume
            }
          }
        }
      }

      // Filter to only include exercises from current workout
      const currentExerciseNames = exercises.map(ex => ex.name)
      return Object.values(records).filter(record => 
        currentExerciseNames.includes(record.exercise)
      )
    } catch (error) {
      console.error('Error calculating personal records:', error)
      return []
    }
  }

  const startWorkout = async (template: WorkoutTemplate) => {
    const now = new Date()
    const exerciseNames = template.exercises.map(ex => ex.name)
    
    // Fetch last workout data for all exercises in this template
    await fetchLastWorkoutData(exerciseNames)
    
    setCurrentWorkout({
      template_id: template.id || '',
      user_id: template.user_id,
      date: now.toISOString().split('T')[0],
      start_time: now.toISOString(),
      end_time: '',
      exercises: template.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets,
        setData: Array(ex.sets).fill(null).map(() => ({ reps: undefined, weight: undefined }))
      }))
    })
    setSelectedTemplate(template)
    setIsWorkoutActive(true)
  }

  const handleSetUpdate = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number | undefined | string) => {
    if (!currentWorkout) return

    const newExercises = [...currentWorkout.exercises]
    const exercise = { ...newExercises[exerciseIndex] }
    const newSetData = [...exercise.setData]
    
    // Parse the value properly - convert string to number if needed
    let parsedValue: number | undefined
    if (value === '' || value === undefined) {
      parsedValue = undefined
    } else if (typeof value === 'string') {
      parsedValue = parseFloat(value)
    } else {
      parsedValue = value
    }
    
    newSetData[setIndex] = { ...newSetData[setIndex], [field]: parsedValue }

    // Auto load logic: if first set is changed and auto load is enabled, fill the rest
    // This is now handled in the onBlur event to avoid partial value filling
    if (setIndex === 0 && typeof parsedValue === 'number') {
      if (field === 'reps' && autoLoadReps && parsedValue !== undefined && !isNaN(parsedValue)) {
        for (let i = 1; i < newSetData.length; i++) {
          if (newSetData[i].reps === undefined) {
            newSetData[i].reps = parsedValue
          }
        }
      }
      if (field === 'weight' && autoLoadWeight && parsedValue !== undefined && !isNaN(parsedValue)) {
        for (let i = 1; i < newSetData.length; i++) {
          if (newSetData[i].weight === undefined) {
            newSetData[i].weight = parsedValue
          }
        }
      }
    }
    exercise.setData = newSetData
    
    // Calculate total volume for this exercise
    const totalVolume = newSetData.reduce((total, set) => {
      const setVolume = (set.reps || 0) * (set.weight || 0)
      return total + setVolume
    }, 0)
    exercise.volume = totalVolume
    
    newExercises[exerciseIndex] = exercise
    setCurrentWorkout({ ...currentWorkout, exercises: newExercises })
  }

  const handleExerciseUpdate = (index: number, field: keyof Exercise, value: string | number) => {
    if (!currentWorkout) return

    const newExercises = [...currentWorkout.exercises]
    const updatedExercise = { ...newExercises[index] }
    
    if (field === 'sets') {
      const newSets = value as number
      const currentSetData = updatedExercise.setData || []
      
      // Adjust setData array size
      if (newSets > currentSetData.length) {
        // Add new sets
        const newSetData = [...currentSetData]
        for (let i = currentSetData.length; i < newSets; i++) {
          newSetData.push({ reps: undefined, weight: undefined })
        }
        updatedExercise.setData = newSetData
      } else if (newSets < currentSetData.length) {
        // Remove excess sets
        updatedExercise.setData = currentSetData.slice(0, newSets)
      }
      
      updatedExercise.sets = newSets
    } else if (field === 'notes') {
      updatedExercise.notes = value as string
    }
    
    // Recalculate volume
    const totalVolume = updatedExercise.setData.reduce((total, set) => {
      const setVolume = (set.reps || 0) * (set.weight || 0)
      return total + setVolume
    }, 0)
    updatedExercise.volume = totalVolume
    
    newExercises[index] = updatedExercise
    setCurrentWorkout({ ...currentWorkout, exercises: newExercises })
  }

  const addExerciseToWorkout = () => {
    if (!currentWorkout || !newExerciseName.trim()) return

    // Ensure sets is a valid number, default to 1 if invalid
    const setsValue = typeof newExerciseSets === 'string' ? parseInt(newExerciseSets) || 1 : newExerciseSets

    const newExercise: Exercise = {
      name: newExerciseName.trim(),
      sets: setsValue,
      setData: Array(setsValue).fill(null).map(() => ({ 
        reps: undefined, 
        weight: undefined 
      })),
      volume: 0
    }

    const newExercises = [...currentWorkout.exercises, newExercise]
    setCurrentWorkout({ ...currentWorkout, exercises: newExercises })

    // Reset form
    setNewExerciseName('')
    setNewExerciseSets(1)
    setShowAddExerciseDialog(false)
  }



  const finishWorkout = async () => {
    if (!currentWorkout) return

    try {
      const now = new Date()
      const startTime = new Date(currentWorkout.start_time)
      const duration = now.getTime() - startTime.getTime()
      
      // Filter out exercises that weren't actually performed (no sets with reps and weight)
      const performedExercises = currentWorkout.exercises.filter(exercise => {
        return exercise.setData.some(set => (set.reps && set.reps > 0) && (set.weight && set.weight > 0))
      })
      
      // Calculate total volume from individual exercise volumes
      const totalVolume = performedExercises.reduce((total, exercise) => {
        return total + (exercise.volume || 0)
      }, 0)

      const workoutToSave = {
        ...currentWorkout,
        exercises: performedExercises, // Only save performed exercises
        end_time: now.toISOString(),
        total_volume: totalVolume
      }

      const { data: savedWorkout, error } = await supabase
        .from('workout_logs')
        .insert([workoutToSave])
        .select()
        .single()

      if (error) throw error

      // Calculate personal records
      const personalRecords = await calculatePersonalRecords(performedExercises)

      // Calculate exercise statistics
      const exerciseStats = performedExercises.map(exercise => {
        const totalSets = exercise.setData.filter(set => (set.reps && set.reps > 0) && (set.weight && set.weight > 0)).length
        const totalReps = exercise.setData.reduce((total, set) => total + (set.reps || 0), 0)
        const totalWeight = exercise.setData.reduce((total, set) => total + (set.weight || 0), 0)
        const maxWeight = Math.max(...exercise.setData.map(set => set.weight || 0))
        const maxReps = Math.max(...exercise.setData.map(set => set.reps || 0))
        const volume = exercise.volume || 0

        return {
          name: exercise.name,
          totalSets,
          totalReps,
          totalWeight,
          maxWeight,
          maxReps,
          volume
        }
      })

      // Format duration
      const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        
        if (hours > 0) {
          return `${hours}h ${minutes % 60}m ${seconds % 60}s`
        }
        return `${minutes}m ${seconds % 60}s`
      }

      setWorkoutSummary({
        totalVolume,
        duration: formatDuration(duration),
        personalRecords,
        exerciseStats
      })

      setCompletedTemplateName(selectedTemplate?.name || null)
      setShowSummary(true)
      // Clear localStorage when workout is finished
      setCurrentWorkout(null)
      setSelectedTemplate(null)
      setIsWorkoutActive(false)
    } catch (error) {
      console.error('Error saving workout:', error)
    }
  }

  const postWorkoutToProfile = async () => {
    if (!workoutSummary) return

    try {
      setPostingToProfile(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Insert shared workout
      const { data: sharedWorkout, error } = await supabase
        .from('shared_workouts')
        .insert([{
          user_id: user.id,
          template_name: completedTemplateName || 'Custom Workout',
          total_volume: workoutSummary.totalVolume,
          duration: workoutSummary.duration,
          exercises: workoutSummary.exerciseStats.map(stat => ({
            name: stat.name,
            totalSets: stat.totalSets,
            totalReps: stat.totalReps,
            totalWeight: stat.totalWeight,
            maxWeight: stat.maxWeight,
            maxReps: stat.maxReps,
            volume: stat.volume
          })),
          exercise_stats: workoutSummary.exerciseStats
        }])
        .select()
        .single()

      if (error) throw error

      // Create post entry for the feed
      const { error: postError } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          post_type: 'workout',
          workout_id: sharedWorkout.id,
        }])

      if (postError) {
        console.error('Error creating post entry:', postError)
        // Don't fail the request if post creation fails, just log it
      }

      // Close the modal after successful post
      setShowSummary(false)
      setPostingToProfile(false)
      setCompletedTemplateName(null)
    } catch (error) {
      console.error('Error posting workout to profile:', error)
      setPostingToProfile(false)
    }
  }

  if (isClient && isWorkoutActive && currentWorkout) {
    return (
      <>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <p className="text-xl text-gray-600 dark:text-gray-400 font-light mb-4">
                {selectedTemplate?.name}
              </p>
              <WorkoutTimer startTime={currentWorkout.start_time} restTimerDuration={settings?.rest_timer_duration || 120} />
            </div>

          <div className="space-y-6">
            {currentWorkout.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="card-apple animate-scale-in" style={{ animationDelay: `${exerciseIndex * 0.1}s` }}>
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold mb-2">{exercise.name}</h3>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Sets</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleExerciseUpdate(exerciseIndex, "sets", parseInt(e.target.value))}
                          className="text-center text-lg w-20 bg-transparent border-none outline-none border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total: {exercise.volume ? exercise.volume.toLocaleString() : '0'} lbs
                    </div>
                  </div>
                  
                  {/* Individual Set Inputs */}
                  <div className="space-y-4">
                    {exercise.setData.map((set, setIndex) => (
                      <div key={setIndex} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[50px] sm:min-w-[60px]">
                          Set {setIndex + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">Reps</label>
                            <input
                              type="number"
                              value={set.reps === undefined ? '' : set.reps}
                              onChange={(e) => handleSetUpdate(exerciseIndex, setIndex, "reps", e.target.value)}
                              onBlur={(e) => {
                                if (setIndex === 0 && autoLoadReps && e.target.value) {
                                  const value = parseFloat(e.target.value)
                                  if (!isNaN(value)) {
                                    // Auto-fill all subsequent sets with this value
                                    const newExercises = [...currentWorkout.exercises]
                                    const exercise = { ...newExercises[exerciseIndex] }
                                    const newSetData = [...exercise.setData]
                                    
                                    // Fill all sets after the first one
                                    for (let i = 1; i < newSetData.length; i++) {
                                      newSetData[i] = { ...newSetData[i], reps: value }
                                    }
                                    
                                    exercise.setData = newSetData
                                    
                                    // Recalculate volume
                                    const totalVolume = newSetData.reduce((total, set) => {
                                      const setVolume = (set.reps || 0) * (set.weight || 0)
                                      return total + setVolume
                                    }, 0)
                                    exercise.volume = totalVolume
                                    
                                    newExercises[exerciseIndex] = exercise
                                    setCurrentWorkout({ ...currentWorkout, exercises: newExercises })
                                  }
                                }
                              }}
                              className="input-apple text-center text-base sm:text-sm w-full py-3 sm:py-2"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">Weight (lbs)</label>
                            <input
                              type="number"
                              value={set.weight === undefined ? '' : set.weight}
                              onChange={(e) => handleSetUpdate(exerciseIndex, setIndex, "weight", e.target.value)}
                              onBlur={(e) => {
                                if (setIndex === 0 && autoLoadWeight && e.target.value) {
                                  const value = parseFloat(e.target.value)
                                  if (!isNaN(value)) {
                                    // Auto-fill all subsequent sets with this value
                                    const newExercises = [...currentWorkout.exercises]
                                    const exercise = { ...newExercises[exerciseIndex] }
                                    const newSetData = [...exercise.setData]
                                    
                                    // Fill all sets after the first one
                                    for (let i = 1; i < newSetData.length; i++) {
                                      newSetData[i] = { ...newSetData[i], weight: value }
                                    }
                                    
                                    exercise.setData = newSetData
                                    
                                    // Recalculate volume
                                    const totalVolume = newSetData.reduce((total, set) => {
                                      const setVolume = (set.reps || 0) * (set.weight || 0)
                                      return total + setVolume
                                    }, 0)
                                    exercise.volume = totalVolume
                                    
                                    newExercises[exerciseIndex] = exercise
                                    setCurrentWorkout({ ...currentWorkout, exercises: newExercises })
                                  }
                                }
                              }}
                              className="input-apple text-center text-base sm:text-sm w-full py-3 sm:py-2"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Last workout data hint */}
                  {formatLastWorkoutDisplay(exercise.name) && (
                    <div className="mt-3 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded text-center">
                      Last workout: {formatLastWorkoutDisplay(exercise.name)}
                    </div>
                  )}
                  

                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notes</label>
                  <input
                    type="text"
                    value={exercise.notes || ''}
                    onChange={(e) => handleExerciseUpdate(exerciseIndex, "notes", e.target.value)}
                    className="input-apple"
                    placeholder="Add any notes about this exercise..."
                  />
                </div>
              </div>
            ))}
            
            {/* Add Exercise Button */}
            <div className="text-center mt-8">
              <Button
                onClick={() => setShowAddExerciseDialog(true)}
                variant="outline"
                className="flex items-center space-x-2 text-lg px-8 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="h-5 w-5" />
                <span>Add Exercise</span>
              </Button>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="flex flex-col items-center space-y-4">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={finishWorkout} 
                      className="btn-apple text-lg px-12 py-4 flex items-center justify-center"
                    >
                      Finish Workout
                    </Button>
                  </TooltipTrigger>
                  {isDemoMode && (
                    <TooltipContent className="bg-black text-white px-4 py-2 text-sm font-medium">
                      <p>Make an account to log workouts</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              
              {!showCancelConfirm ? (
                <Button 
                  onClick={() => setShowCancelConfirm(true)}
                  variant="outline"
                  className="text-lg px-8 py-3 flex items-center justify-center text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Cancel Workout
                </Button>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={() => {
                      console.log('User confirmed workout cancellation')
                      setCurrentWorkout(null)
                      setSelectedTemplate(null)
                      setIsWorkoutActive(false)
                      setShowCancelConfirm(false)
                    }}
                    className="text-lg px-8 py-3 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm Cancel
                  </Button>
                  <Button 
                    onClick={() => setShowCancelConfirm(false)}
                    variant="outline"
                    className="text-sm px-6 py-2 flex items-center justify-center text-gray-600 border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                  >
                    Keep Working Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Exercise Dialog */}
      <Dialog open={showAddExerciseDialog} onOpenChange={setShowAddExerciseDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl text-center text-gray-900 dark:text-gray-100">Add Exercise</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Exercise Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exercise Name
              </label>
              <Select.Root value={newExerciseName} onValueChange={setNewExerciseName}>
                <Select.Trigger className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-between">
                  <Select.Value placeholder="Select exercise">{getExerciseLabel(newExerciseName, customExercises)}</Select.Value>
                  <Select.Icon>
                    <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Content position="popper" sideOffset={4} className="z-50 w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
                  <Select.Viewport>
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

            {/* Sets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Sets
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={newExerciseSets}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setNewExerciseSets('');
                  } else {
                    const parsed = parseInt(value);
                    setNewExerciseSets(isNaN(parsed) ? '' : parsed);
                  }
                }}
                className="input-apple"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={addExerciseToWorkout}
                disabled={!newExerciseName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Exercise
              </Button>
              <Button
                onClick={() => setShowAddExerciseDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
    )
  }

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Start a Workout</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            Choose a workout template to begin tracking your workout.
          </p>
        </div>
        <div className="grid gap-6">
          {templates.map((template, index) => (
            <div key={template.id} className="p-6 bg-white dark:bg-black pink:bg-pink-50 border border-gray-200 dark:border-gray-800 pink:border-pink-200 rounded-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{template.name}</h3>
                <div className="flex justify-center">
                  <Button 
                    disabled
                    className="font-medium bg-gray-400 text-white rounded-full mt-2"
                  >
                    Loading...
                  </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Start a Workout</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            Choose a workout template to begin tracking your workout.
          </p>
        </div>

        {/* Resume Workout Banner */}
        {isClient && currentWorkout && selectedTemplate && isWorkoutActive && (
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 pink:bg-pink-50 border border-blue-200 dark:border-blue-800 pink:border-pink-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Workout in Progress
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  You have an active workout: <span className="font-medium">{selectedTemplate.name}</span>
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Started {new Date(currentWorkout.start_time).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => {
                    // Resume the workout by fetching last workout data
                    const exerciseNames = currentWorkout.exercises.map(ex => ex.name)
                    fetchLastWorkoutData(exerciseNames)
                  }}
                  className="font-medium bg-blue-600 hover:bg-blue-700 pink:bg-pink-600 pink:hover:bg-pink-700 text-white"
                >
                  Resume Workout
                </Button>
                {!showCancelConfirm ? (
                  <Button 
                    onClick={() => setShowCancelConfirm(true)}
                    variant="ghost"
                    className="font-medium text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Cancel Workout
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => {
                        setCurrentWorkout(null)
                        setSelectedTemplate(null)
                        setIsWorkoutActive(false)
                        setShowCancelConfirm(false)
                      }}
                      className="font-medium bg-red-600 hover:bg-red-700 text-white"
                    >
                      Confirm Cancel
                    </Button>
                    <Button 
                      onClick={() => setShowCancelConfirm(false)}
                      variant="outline"
                      className="font-medium text-gray-600 border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20"
                    >
                      Keep
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {templates.map((template, index) => (
            <WorkoutTemplateCard 
              key={template.id} 
              template={template} 
              onStartWorkout={startWorkout} 
            />
          ))}
        </div>
      </div>

      {/* Workout Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-gray-900 dark:text-gray-100">Workout Complete! 🎉</DialogTitle>
          </DialogHeader>
          
          {workoutSummary && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Total Volume</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {workoutSummary.totalVolume.toLocaleString()} lbs
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Duration</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {workoutSummary.duration}
                  </p>
                </div>
              </div>

              {/* Exercise Breakdown */}
              <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">Exercise Breakdown</h3>
                <div className="space-y-3">
                  {workoutSummary.exerciseStats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{stat.name}</span>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {stat.totalSets} sets • {stat.totalReps} reps • {stat.totalWeight} lbs
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Max: {stat.maxWeight} lbs × {stat.maxReps} reps
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                          Volume: {stat.volume.toLocaleString()} lbs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Records */}
              {workoutSummary.personalRecords.length > 0 && (
                <div className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
                  <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">Personal Records</h3>
                  <div className="space-y-3">
                    {workoutSummary.personalRecords.map((record, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{record.exercise}</span>
                        <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                          <div>Max Weight: {record.maxWeight} lbs</div>
                          <div>Max Reps: {record.maxReps}</div>
                          <div>Max Volume: {record.maxVolume} lbs</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center pt-4 space-y-3">
                <Button 
                  onClick={postWorkoutToProfile}
                  disabled={postingToProfile}
                  className="font-medium bg-blue-600 hover:bg-blue-700 pink:bg-pink-600 pink:hover:bg-pink-700 text-white mr-3"
                >
                  {postingToProfile ? 'Posting...' : 'Post to Profile'}
                </Button>
                <Button 
                  onClick={() => {
                    setShowSummary(false)
                    setCompletedTemplateName(null)
                  }}
                  variant="outline"
                  className="font-medium"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </>
  )
} 