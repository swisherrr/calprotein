"use client"

import { useState, useEffect } from "react"
import { ScatterChart } from "@mui/x-charts/ScatterChart"
import { supabase } from "@/lib/supabase"
import { EXERCISE_GROUPS } from "@/lib/exercises"

interface WorkoutData {
  id: string
  date: string
  total_volume: number
  exercises: Array<{
    name: string
    volume: number
  }>
}

interface ChartData {
  date: string
  volume: number
  exercise?: string
}

export function WorkoutAnalytics() {
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([])
  const [loading, setLoading] = useState(true)

  // Single dropdown options
  const chartOptions = [
    { value: 'total-volume', label: 'Total Volume Over Time' },
    { value: 'all-exercises', label: 'All Exercises' },
    ...EXERCISE_GROUPS.map(group => ({ value: `muscle-group:${group.label}`, label: `Muscle Group: ${group.label}` }))
  ]

  // State for chart type and muscle group
  const [chartType, setChartType] = useState<'total-volume' | 'muscle-groups' | 'all-exercises'>('total-volume')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("")
  const [dropdownValue, setDropdownValue] = useState('total-volume')
  useEffect(() => {
    if (dropdownValue.startsWith('muscle-group:')) {
      setChartType('muscle-groups')
      setSelectedMuscleGroup(dropdownValue.replace('muscle-group:', ''))
    } else {
      setChartType(dropdownValue as any)
      setSelectedMuscleGroup('')
    }
  }, [dropdownValue])

  useEffect(() => {
    loadWorkoutData()
  }, [])

  const loadWorkoutData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, date, total_volume, exercises')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (error) throw error

      setWorkoutData(data || [])
    } catch (error) {
      console.error('Error loading workout data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalVolumeData = (): ChartData[] => {
    return workoutData.map(workout => ({
      date: workout.date,
      volume: workout.total_volume
    }))
  }

  const getMuscleGroupData = (): ChartData[] => {
    if (!selectedMuscleGroup) return []

    const exercisesInGroup = EXERCISE_GROUPS.find(group => group.label === selectedMuscleGroup)?.exercises || []
    
    const chartData: ChartData[] = []
    
    workoutData.forEach(workout => {
      workout.exercises.forEach(exercise => {
        // Only include exercises that were actually performed (volume > 0)
        if (exercisesInGroup.includes(exercise.name) && exercise.volume && exercise.volume > 0) {
          chartData.push({
            date: workout.date,
            volume: exercise.volume,
            exercise: exercise.name
          })
        }
      })
    })

    return chartData
  }

  const getAllExercisesData = (): ChartData[] => {
    const chartData: ChartData[] = []
    
    workoutData.forEach(workout => {
      workout.exercises.forEach(exercise => {
        // Only include exercises that were actually performed (volume > 0)
        if (exercise.volume && exercise.volume > 0) {
          chartData.push({
            date: workout.date,
            volume: exercise.volume,
            exercise: exercise.name
          })
        }
      })
    })

    return chartData
  }

  const getChartData = () => {
    switch (chartType) {
      case "total-volume":
        return getTotalVolumeData()
      case "muscle-groups":
        return getMuscleGroupData()
      case "all-exercises":
        return getAllExercisesData()
      default:
        return getTotalVolumeData()
    }
  }

  const getUniqueExercises = (data: ChartData[]): string[] => {
    return [...new Set(data.map(item => item.exercise).filter((exercise): exercise is string => Boolean(exercise)))]
  }

  const formatChartData = (data: ChartData[]) => {
    if (chartType === "total-volume") {
      return {
        xAxis: [{
          scaleType: 'time' as const,
          valueFormatter: (value: number) => new Date(value).toLocaleDateString()
        }],
        series: [{
          label: 'Total Volume (lbs)',
          data: data.map((d, idx) => ({
            id: idx,
            x: new Date(d.date).getTime(),
            y: d.volume
          })),
          color: '#3b82f6'
        }]
      }
    } else {
      const exercises = getUniqueExercises(data);
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
      return {
        xAxis: [{
          scaleType: 'time' as const,
          valueFormatter: (value: number) => new Date(value).toLocaleDateString()
        }],
        series: exercises.map((exercise, index) => ({
          label: exercise,
          data: data
            .filter(d => d.exercise === exercise)
            .map((d, idx) => ({
              id: `${exercise}-${idx}`,
              x: new Date(d.date).getTime(),
              y: d.volume
            })),
          color: colors[index % colors.length]
        }))
      }
    }
  }

  if (loading) {
    return (
      <div className="container-apple section-apple">
        <div className="animate-fade-in-up">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading workout data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (workoutData.length === 0) {
    return (
      <div className="container-apple section-apple">
        <div className="animate-fade-in-up">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">No Workout Data</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Start logging workouts to see your progress analytics here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const chartData = getChartData()
  const chartConfig = formatChartData(chartData)
  
  // Debug logging
  console.log('Workout Data:', workoutData)
  console.log('Chart Data:', chartData)
  console.log('Chart Config:', chartConfig)

  return (
    <div className="container-apple section-apple">
      <div className="animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="mb-4">Workout Analytics</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-light">
            Track your progress and volume over time
          </p>
        </div>

        {/* Single Chart Type Dropdown */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2">
            <label className="text-sm font-medium">Chart:</label>
            <select
              value={dropdownValue}
              onChange={(e) => setDropdownValue(e.target.value)}
              className="input-apple text-sm rounded-none"
              style={{ borderRadius: 0 }}
            >
              {chartOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: 0, padding: '2rem' }}>
          <div className="h-96">
            <ScatterChart
              xAxis={chartConfig.xAxis}
              series={chartConfig.series}
              height={350}
              margin={{ top: 20, bottom: 30, left: 40, right: 20 }}
              tooltip={{ trigger: 'none' }}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card-apple text-center" style={{ borderRadius: 0 }}>
            <h3 className="text-lg font-semibold mb-2">Total Workouts</h3>
            <p className="text-3xl font-bold text-blue-600">
              {workoutData.length}
            </p>
          </div>
          <div className="card-apple text-center" style={{ borderRadius: 0 }}>
            <h3 className="text-lg font-semibold mb-2">Total Volume</h3>
            <p className="text-3xl font-bold text-green-600">
              {workoutData.reduce((total, workout) => total + workout.total_volume, 0).toLocaleString()} lbs
            </p>
          </div>
          <div className="card-apple text-center" style={{ borderRadius: 0 }}>
            <h3 className="text-lg font-semibold mb-2">Avg Volume/Workout</h3>
            <p className="text-3xl font-bold text-purple-600">
              {Math.round(workoutData.reduce((total, workout) => total + workout.total_volume, 0) / workoutData.length).toLocaleString()} lbs
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 