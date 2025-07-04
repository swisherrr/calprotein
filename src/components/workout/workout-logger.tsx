"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"

interface Exercise {
  name: string
  sets: number
  reps?: number
  weight?: number
  volume?: number
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

interface PersonalRecord {
  exercise: string
  maxWeight: number
  maxReps: number
  maxVolume: number
}

// Timer component
function WorkoutTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(startTime).getTime()
      const now = new Date().getTime()
      setElapsed(now - start)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

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
      <div className="inline-block bg-gray-100 dark:bg-gray-800 rounded-full px-6 py-3">
        <span className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200">
          {formatTime(elapsed)}
        </span>
      </div>
    </div>
  )
}

export function WorkoutLogger() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null)
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutLog | null>(null)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [lastWorkoutData, setLastWorkoutData] = useState<Record<string, { reps?: number, weight?: number }>>({})
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

  const fetchLastWorkoutData = async (exerciseNames: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const lastWorkoutDataMap: Record<string, { reps?: number, weight?: number }> = {}

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
          if (exercise && (exercise.reps || exercise.weight)) {
            lastWorkoutDataMap[exerciseName] = {
              reps: exercise.reps,
              weight: exercise.weight
            }
            break
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
          const { name, reps = 0, weight = 0 } = exercise
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
    const updatedExercise = { ...newExercises[index], [field]: value }
    
    // Calculate volume when reps or weight changes
    if (field === 'reps' || field === 'weight' || field === 'sets') {
      const sets = field === 'sets' ? value as number : (updatedExercise.sets || 0)
      const reps = field === 'reps' ? value as number : (updatedExercise.reps || 0)
      const weight = field === 'weight' ? value as number : (updatedExercise.weight || 0)
      updatedExercise.volume = sets * reps * weight
    }
    
    newExercises[index] = updatedExercise
    setCurrentWorkout({ ...currentWorkout, exercises: newExercises })
  }

  const finishWorkout = async () => {
    if (!currentWorkout) return

    try {
      const now = new Date()
      const startTime = new Date(currentWorkout.start_time)
      const duration = now.getTime() - startTime.getTime()
      
      // Filter out exercises that weren't actually performed (no reps or weight)
      const performedExercises = currentWorkout.exercises.filter(exercise => 
        (exercise.reps && exercise.reps > 0) && (exercise.weight && exercise.weight > 0)
      )
      
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
        const totalSets = exercise.sets || 0
        const totalReps = (exercise.reps || 0) * totalSets
        const totalWeight = (exercise.weight || 0) * totalSets
        const maxWeight = exercise.weight || 0
        const maxReps = exercise.reps || 0
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
      <div className="container-apple section-apple">
        <div className="animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="mb-4">Current Workout</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-light mb-4">
              {selectedTemplate?.name}
            </p>
            <WorkoutTimer startTime={currentWorkout.start_time} />
          </div>

          <div className="space-y-6">
            {currentWorkout.exercises.map((exercise, index) => (
              <div key={index} className="card-apple animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold mb-2">{exercise.name}</h3>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-6">
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
                    {lastWorkoutData[exercise.name]?.reps && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last: {lastWorkoutData[exercise.name].reps} reps
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Weight</label>
                    <input
                      type="number"
                      value={exercise.weight || ''}
                      onChange={(e) => handleExerciseUpdate(index, "weight", parseInt(e.target.value))}
                      className="input-apple text-center text-lg"
                    />
                    {lastWorkoutData[exercise.name]?.weight && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last: {lastWorkoutData[exercise.name].weight} lbs
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Volume</label>
                    <div className="input-apple text-center text-lg bg-gray-50 dark:bg-gray-800 py-2 px-3">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {exercise.volume?.toLocaleString() || '0'} lbs
                      </span>
                    </div>
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
            <div className="flex justify-center">
              <Button 
                onClick={finishWorkout} 
                className="btn-apple text-lg px-12 py-4 flex items-center justify-center"
              >
                Finish Workout
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container-apple section-apple">
        <div className="animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="mb-4">Start a Workout</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto">
              Choose a workout template to begin tracking your workout.
            </p>
          </div>

          <div className="grid gap-8 max-w-4xl mx-auto">
            {templates.map((template, index) => (
              <div key={template.id} className="card-apple animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold mb-4">{template.name}</h3>
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => startWorkout(template)} 
                      className="btn-apple text-lg px-12 py-4 flex items-center justify-center"
                    >
                      Start Workout
                    </Button>
                  </div>
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

      {/* Workout Summary Modal */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Workout Complete! 🎉</DialogTitle>
          </DialogHeader>
          
          {workoutSummary && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card-apple text-center">
                  <h3 className="text-lg font-semibold mb-2">Total Volume</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {workoutSummary.totalVolume.toLocaleString()} lbs
                  </p>
                </div>
                <div className="card-apple text-center">
                  <h3 className="text-lg font-semibold mb-2">Duration</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {workoutSummary.duration}
                  </p>
                </div>
              </div>

              {/* Exercise Breakdown */}
              <div className="card-apple">
                <h3 className="text-xl font-semibold mb-4">Exercise Breakdown</h3>
                <div className="space-y-3">
                  {workoutSummary.exerciseStats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      <div>
                        <span className="font-medium">{stat.name}</span>
                        <div className="text-sm text-gray-500">
                          {stat.totalSets} sets • {stat.totalReps} reps • {stat.totalWeight} lbs
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
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
                <div className="card-apple">
                  <h3 className="text-xl font-semibold mb-4">Personal Records</h3>
                  <div className="space-y-3">
                    {workoutSummary.personalRecords.map((record, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                        <span className="font-medium">{record.exercise}</span>
                        <div className="text-right text-sm">
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
                  className="btn-apple text-lg px-8 py-3"
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