"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, Dumbbell, TrendingUp, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { useWorkoutLogs, WorkoutLog, Exercise } from "@/hooks/use-workout-logs"
import { useDemo } from "@/components/providers/demo-provider"

export default function WorkoutHistoryPage() {
  const { logs, loading } = useWorkoutLogs()
  const { isDemoMode } = useDemo()
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"date" | "volume">("date")

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
                const totalVolume = calculateTotalVolume(workout.exercises)
                const duration = workout.end_time ? formatDuration(workout.start_time, workout.end_time) : null
                const isExpanded = expandedWorkout === workout.id
                
                return (
                  <motion.div
                    key={workout.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    layout
                  >
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => setExpandedWorkout(isExpanded ? null : workout.id || "")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {formatDate(workout.start_time)}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTime(workout.start_time)}
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
                              {workout.exercises.length} exercises
                            </div>
                            {totalVolume > 0 && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {totalVolume.toLocaleString()} lbs
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-100 dark:border-gray-700"
                        >
                          <div className="p-6 pt-0">
                            <div className="space-y-4">
                              {workout.exercises.map((exercise, index) => (
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
                                    {exercise.volume && exercise.volume > 0 && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {exercise.volume.toLocaleString()} lbs
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                    {exercise.setData.map((set, setIndex) => (
                                      <div
                                        key={setIndex}
                                        className="bg-white dark:bg-gray-600 rounded-lg p-2 text-center"
                                      >
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                          {set.weight ? `${set.weight}lbs` : '-'}
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400">
                                          {set.reps ? `${set.reps} reps` : '-'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {exercise.notes && (
                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                      "{exercise.notes}"
                                    </div>
                                  )}
                                </motion.div>
                              ))}
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
