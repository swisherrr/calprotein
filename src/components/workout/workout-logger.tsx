"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useDemo } from "@/components/providers/demo-provider"
import { useWorkoutTemplates } from "@/hooks/use-workout-templates"
import { useWorkoutLogs } from "@/hooks/use-workout-logs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

// Timer component
function WorkoutTimer({ startTime }: { startTime: string }) {
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
    }, 2 * 60 * 1000) // 2 minutes
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
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null)
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutLog | null>(null)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [lastWorkoutData, setLastWorkoutData] = useState<Record<string, { reps?: number, weight?: number, volume?: number }>>({})
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
  const [autoLoadReps, setAutoLoadReps] = useState(false)
  const [autoLoadWeight, setAutoLoadWeight] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    setAutoLoadReps(localStorage.getItem('autoLoadReps') === 'true')
    setAutoLoadWeight(localStorage.getItem('autoLoadWeight') === 'true')
  }, [])

  const fetchLastWorkoutData = async (exerciseNames: string[]) => {
    if (isDemoMode) {
      // Use demo workout logs for last workout data
      const lastWorkoutDataMap: Record<string, { reps?: number, weight?: number, volume?: number }> = {}
      
      for (const exerciseName of exerciseNames) {
        // Find the most recent workout that contains this exercise
        for (const workout of demoData.workoutLogs) {
          const exercise = workout.exercises?.find((ex: any) => ex.name === exerciseName)
          if (exercise && exercise.setData && exercise.setData.length > 0) {
            const firstSet = exercise.setData[0]
            lastWorkoutDataMap[exerciseName] = {
              reps: firstSet.reps,
              weight: firstSet.weight,
              volume: exercise.volume || 0
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

      const lastWorkoutDataMap: Record<string, { reps?: number, weight?: number, volume?: number }> = {}

      for (const exerciseName of exerciseNames) {
        const { data, error } = await supabase
          .from('workout_logs')
          .select('exercises')
          .eq('user_id', user.id)
          .not('exercises', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          console.error('Error fetching last workout data:', error)
          continue
        }

        // Find the most recent workout that contains this exercise
        for (const workout of data || []) {
          const exercise = workout.exercises?.find((ex: any) => ex.name === exerciseName)
          if (exercise) {
            // Handle both old format (single reps/weight) and new format (setData)
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
                const firstSet = exercise.setData[0]
                lastWorkoutDataMap[exerciseName] = {
                  reps: firstSet.reps,
                  weight: firstSet.weight,
                  volume: totalVolume
                }
                break
              }
            } else if (exercise.reps || exercise.weight) {
              // Old format: use the single reps/weight values
              const volume = (exercise.reps || 0) * (exercise.weight || 0)
              lastWorkoutDataMap[exerciseName] = {
                reps: exercise.reps,
                weight: exercise.weight,
                volume: volume
              }
              break
            }
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

      const { error } = await supabase
        .from('workout_logs')
        .insert([workoutToSave])

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

      setShowSummary(true)
      setCurrentWorkout(null)
      setSelectedTemplate(null)
      setIsWorkoutActive(false)
    } catch (error) {
      console.error('Error saving workout:', error)
    }
  }

  if (isWorkoutActive && currentWorkout) {
    return (
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="animate-fade-in-up">
          <div className="text-center mb-8">
            <p className="text-xl text-gray-600 dark:text-gray-400 font-light mb-4">
              {selectedTemplate?.name}
            </p>
            <WorkoutTimer startTime={currentWorkout.start_time} />
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
                  {lastWorkoutData[exercise.name] && (
                    <div className="mt-3 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 p-2 rounded text-center">
                      Last workout: {lastWorkoutData[exercise.name].reps} reps × {lastWorkoutData[exercise.name].weight} lbs ({lastWorkoutData[exercise.name].volume?.toLocaleString()} lbs total volume)
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
          </div>

          <div className="text-center mt-12">
            <div className="flex justify-center">
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
            </div>
          </div>
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

        <div className="grid gap-6">
          {templates.map((template, index) => (
            <div key={template.id} className="p-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{template.name}</h3>
                <div className="flex justify-center">
                  <Button 
                    onClick={() => startWorkout(template)} 
                    className="font-medium bg-white text-white hover:bg-blue-600 dark:bg-blue-900 dark:hover:bg-blue-800 rounded-full mt-2"
                  >
                    Start Workout
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
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
            </div>
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

              <div className="text-center pt-4">
                <Button 
                  onClick={() => setShowSummary(false)}
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