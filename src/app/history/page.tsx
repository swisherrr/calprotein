"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, Dumbbell, TrendingUp, Filter, ChevronDown, ChevronUp, Edit2, Save, X, Plus } from "lucide-react"
import { useWorkoutLogs, WorkoutLog, Exercise } from "@/hooks/use-workout-logs"
import { useDemo } from "@/components/providers/demo-provider"
import { EXERCISE_LIST } from "@/lib/exercises"

export default function WorkoutHistoryPage() {
  const { logs, loading, updateLog } = useWorkoutLogs()
  const { isDemoMode } = useDemo()
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"date" | "volume">("date")
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null)
  const [editingExercise, setEditingExercise] = useState<number | null>(null)
  const [editingSet, setEditingSet] = useState<number | null>(null)
  const [tempWorkoutData, setTempWorkoutData] = useState<WorkoutLog | null>(null)
  const [showAddExercise, setShowAddExercise] = useState<boolean>(false)
  const [newExerciseName, setNewExerciseName] = useState<string>("")

  // Group workouts by month
  const groupedWorkouts = useMemo(() => {
    const groups: { [key: string]: WorkoutLog[] } = {}
    
    logs.forEach(log => {
      const date = new Date(log.start_time)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      if (!groups[monthName]) {
        groups[monthName] = []
      }
      groups[monthName].push(log)
    })

    // Sort workouts within each month
    Object.keys(groups).forEach(month => {
      groups[month].sort((a, b) => {
        if (sortBy === "volume") {
          const volumeA = a.exercises.reduce((total, exercise) => total + (exercise.volume || 0), 0)
          const volumeB = b.exercises.reduce((total, exercise) => total + (exercise.volume || 0), 0)
          return volumeB - volumeA
        }
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      })
    })

    return groups
  }, [logs, sortBy])

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const calculateTotalVolume = (exercises: Exercise[]) => {
    return exercises.reduce((total, exercise) => total + (exercise.volume || 0), 0)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const startEditing = (workout: WorkoutLog) => {
    setEditingWorkout(workout.id || "")
    setTempWorkoutData({ ...workout })
  }

  const cancelEditing = () => {
    setEditingWorkout(null)
    setTempWorkoutData(null)
    setEditingExercise(null)
    setEditingSet(null)
    setShowAddExercise(false)
    setNewExerciseName("")
  }

  const saveWorkout = async () => {
    if (!tempWorkoutData) return

    try {
      // Recalculate volume for each exercise
      const updatedExercises = tempWorkoutData.exercises.map(exercise => {
        const volume = exercise.setData.reduce((total, set) => {
          return total + ((set.weight || 0) * (set.reps || 0))
        }, 0)
        return { ...exercise, volume }
      })

      // Only include fields that exist in the database
      const updatedWorkout: WorkoutLog = {
        id: tempWorkoutData.id,
        template_id: tempWorkoutData.template_id,
        user_id: tempWorkoutData.user_id,
        date: tempWorkoutData.date,
        start_time: tempWorkoutData.start_time,
        end_time: tempWorkoutData.end_time,
        exercises: updatedExercises
      }

      console.log('Saving workout:', updatedWorkout)
      const result = await updateLog(updatedWorkout)
      console.log('Update result:', result)
      cancelEditing()
    } catch (error) {
      console.error('Error updating workout:', error)
      alert('Failed to update workout. Please try again.')
    }
  }

  const updateSetData = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    if (!tempWorkoutData) return

    const updatedExercises = [...tempWorkoutData.exercises]
    const updatedSetData = [...updatedExercises[exerciseIndex].setData]
    updatedSetData[setIndex] = { ...updatedSetData[setIndex], [field]: value }
    updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], setData: updatedSetData }

    setTempWorkoutData({ ...tempWorkoutData, exercises: updatedExercises })
  }

  const addExercise = () => {
    if (!tempWorkoutData || !newExerciseName.trim()) return

    const newExercise: Exercise = {
      name: newExerciseName,
      sets: 1,
      setData: [{ weight: 0, reps: 0 }],
      volume: 0,
      notes: ""
    }

    setTempWorkoutData({
      ...tempWorkoutData,
      exercises: [...tempWorkoutData.exercises, newExercise]
    })

    setNewExerciseName("")
    setShowAddExercise(false)
  }

  const removeExercise = (exerciseIndex: number) => {
    if (!tempWorkoutData) return

    const updatedExercises = tempWorkoutData.exercises.filter((_, index) => index !== exerciseIndex)
    setTempWorkoutData({ ...tempWorkoutData, exercises: updatedExercises })
  }

  const addSet = (exerciseIndex: number) => {
    if (!tempWorkoutData) return

    const updatedExercises = [...tempWorkoutData.exercises]
    const updatedSetData = [...updatedExercises[exerciseIndex].setData, { weight: 0, reps: 0 }]
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      setData: updatedSetData,
      sets: updatedSetData.length
    }

    setTempWorkoutData({ ...tempWorkoutData, exercises: updatedExercises })
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!tempWorkoutData) return

    const updatedExercises = [...tempWorkoutData.exercises]
    const updatedSetData = updatedExercises[exerciseIndex].setData.filter((_, index) => index !== setIndex)
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      setData: updatedSetData,
      sets: updatedSetData.length
    }

    setTempWorkoutData({ ...tempWorkoutData, exercises: updatedExercises })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Dumbbell className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No workouts yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start logging your workouts to see your history here.
          </p>
          <motion.a
            href="/workout"
            className="inline-flex items-center px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            Start Your First Workout
          </motion.a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Workout History
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Track your fitness journey and see your progress over time.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "volume")}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="volume">Sort by Volume</option>
          </select>
        </div>
      </div>

      {/* Workout History */}
      <div className="space-y-8">
        {Object.entries(groupedWorkouts).map(([month, workouts]) => (
          <motion.div
            key={month}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {month}
            </h2>
            
            <div className="space-y-3">
              {workouts.map((workout) => {
                const currentWorkout = editingWorkout === workout.id ? tempWorkoutData : workout
                const totalVolume = currentWorkout ? calculateTotalVolume(currentWorkout.exercises) : 0
                const duration = currentWorkout?.end_time ? formatDuration(currentWorkout.start_time, currentWorkout.end_time) : null
                const isExpanded = expandedWorkout === workout.id
                const isEditing = editingWorkout === workout.id
                
                return (
                  <motion.div
                    key={workout.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: isEditing ? 1 : 1.02 }}
                    layout
                  >
                    <div
                      className="p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {currentWorkout && formatDate(currentWorkout.start_time)}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {currentWorkout && formatTime(currentWorkout.start_time)}
                            </span>
                            {duration && (
                              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="h-4 w-4" />
                                {duration}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Dumbbell className="h-4 w-4" />
                              {currentWorkout?.exercises.length} exercises
                            </div>
                            {totalVolume > 0 && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {totalVolume.toLocaleString()} lbs
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedWorkout(isExpanded ? null : workout.id || "")}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="h-5 w-5" />
                            </motion.div>
                          </button>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && currentWorkout && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-100 dark:border-gray-700"
                        >
                          <div className="p-6 pt-0">
                            {/* Edit Controls */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Workout Details
                              </h3>
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={saveWorkout}
                                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                                      title="Save changes"
                                    >
                                      <Save className="h-4 w-4" />
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                                      title="Cancel editing"
                                    >
                                      <X className="h-4 w-4" />
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startEditing(workout)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                                    title="Edit workout"
                                  >
                                    <Edit2 className="h-4 w-4" />
                          
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="space-y-4">
                              {currentWorkout.exercises.map((exercise, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                      {exercise.name}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      {exercise.volume && exercise.volume > 0 && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {exercise.volume.toLocaleString()} lbs
                                        </span>
                                      )}
                                      {isEditing && (
                                        <button
                                          onClick={() => removeExercise(index)}
                                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                          title="Remove exercise"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                    {exercise.setData.map((set, setIndex) => (
                                      <div
                                        key={setIndex}
                                        className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center"
                                      >
                                        {isEditing ? (
                                          <div className="space-y-1">
                                            <input
                                              type="number"
                                              value={set.weight || ""}
                                              onChange={(e) => updateSetData(index, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                                              placeholder="Weight"
                                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            />
                                            <input
                                              type="number"
                                              value={set.reps || ""}
                                              onChange={(e) => updateSetData(index, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                              placeholder="Reps"
                                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            />
                                            <button
                                              onClick={() => removeSet(index, setIndex)}
                                              className="text-red-500 hover:text-red-700 text-xs"
                                              title="Remove set"
                                            >
                                              <X className="h-3 w-3 mx-auto" />
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                              {set.weight ? `${set.weight}lbs` : '-'}
                                            </div>
                                            <div className="text-gray-500 dark:text-gray-400">
                                              {set.reps ? `${set.reps} reps` : '-'}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                    {isEditing && (
                                      <button
                                        onClick={() => addSet(index)}
                                        className="bg-gray-200 dark:bg-gray-500 rounded-lg p-2 text-center hover:bg-gray-300 dark:hover:bg-gray-400 transition-colors flex items-center justify-center"
                                        title="Add set"
                                      >
                                        <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                      </button>
                                    )}
                                  </div>
                                  
                                  {exercise.notes && (
                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                      "{exercise.notes}"
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                              
                              {isEditing && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-dashed border-blue-200 dark:border-blue-700"
                                >
                                  {showAddExercise ? (
                                    <div className="space-y-3">
                                      <input
                                        type="text"
                                        value={newExerciseName}
                                        onChange={(e) => setNewExerciseName(e.target.value)}
                                        placeholder="Enter exercise name"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        list="exercise-suggestions"
                                      />
                                      <datalist id="exercise-suggestions">
                                        {EXERCISE_LIST.map((exercise) => (
                                          <option key={exercise} value={exercise} />
                                        ))}
                                      </datalist>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={addExercise}
                                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                          Add Exercise
                                        </button>
                                        <button
                                          onClick={() => setShowAddExercise(false)}
                                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setShowAddExercise(true)}
                                      className="w-full flex items-center justify-center gap-2 py-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add Exercise
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
