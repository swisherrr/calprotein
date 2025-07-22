"use client"

import { useState, useEffect } from "react"
import { ScatterChart } from "@mui/x-charts/ScatterChart"
import { supabase } from "@/lib/supabase"
import { EXERCISE_GROUPS, getCombinedExerciseGroups } from "@/lib/exercises"
import { useCustomExercises } from "@/hooks/use-custom-exercises"
import { startOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears, isSameMonth, isSameYear, isWithinInterval, parseISO } from 'date-fns'

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

// Custom hook for responsive dimensions
function useResponsiveDimensions() {
  const [dimensions, setDimensions] = useState({
    isMobile: false,
    chartHeight: 350,
    margins: { top: 20, bottom: 30, left: 40, right: 20 }
  })

  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth < 640
      setDimensions({
        isMobile,
        chartHeight: isMobile ? 240 : 350,
        margins: {
          top: 20,
          bottom: isMobile ? 50 : 30,
          left: isMobile ? 50 : 40,
          right: isMobile ? 30 : 20
        }
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return dimensions
}

export function WorkoutAnalytics() {
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([])
  const [loading, setLoading] = useState(true)
  const { chartHeight, margins, isMobile } = useResponsiveDimensions()
  const { customExercises } = useCustomExercises()

  // Single dropdown options
  const chartOptions = [
    { value: 'total-volume', label: 'Total Volume Over Time' },
    { value: 'all-exercises', label: 'All Exercises' },
    ...getCombinedExerciseGroups(customExercises).map(group => ({ value: `muscle-group:${group.label}`, label: `Muscle Group: ${group.label}` }))
  ]

  // State for chart type and muscle group
  const [chartType, setChartType] = useState<'total-volume' | 'muscle-groups' | 'all-exercises'>('total-volume')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("")
  const [dropdownValue, setDropdownValue] = useState('total-volume')
  const [timeframeValue, setTimeframeValue] = useState('all')
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

  // Dynamically generate month options for current year up to current month
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthOptions = Array.from({ length: currentMonth + 1 }, (_, i) => ({
    value: `month-${i+1}`,
    label: monthNames[i]
  }));

  // Update filterWorkoutDataByTimeframe to handle month selection
  function filterWorkoutDataByTimeframe(data: WorkoutData[], timeframe: string): WorkoutData[] {
    const now = new Date();
    if (timeframe === 'week') {
      const weekAgo = subWeeks(now, 1);
      return data.filter(w => parseISO(w.date) >= weekAgo);
    }
    if (timeframe === 'month') {
      const monthAgo = subMonths(now, 1);
      return data.filter(w => parseISO(w.date) >= monthAgo);
    }
    if (timeframe.startsWith('month-')) {
      // e.g. month-1 for January
      const monthIdx = parseInt(timeframe.split('-')[1], 10) - 1;
      const year = now.getFullYear();
      return data.filter(w => {
        const d = parseISO(w.date);
        return d.getFullYear() === year && d.getMonth() === monthIdx;
      });
    }
    if (timeframe === 'prev-year') {
      const prevYear = now.getFullYear() - 1;
      return data.filter(w => parseISO(w.date).getFullYear() === prevYear);
    }
    if (timeframe === 'ytd') {
      const start = startOfYear(now);
      return data.filter(w => parseISO(w.date) >= start);
    }
    // 'all' or fallback
    return data;
  }

  // Use filtered/aggregated data for chart
  const filteredWorkoutData = filterWorkoutDataByTimeframe(workoutData, timeframeValue);

  // Update getTotalVolumeData etc. to use filteredWorkoutData
  const getTotalVolumeData = (): ChartData[] => {
    return filteredWorkoutData.map(workout => ({
      date: workout.date,
      volume: workout.total_volume
    }))
  }
  const getMuscleGroupData = (): ChartData[] => {
    if (!selectedMuscleGroup) return []
    const exercisesInGroup = EXERCISE_GROUPS.find(group => group.label === selectedMuscleGroup)?.exercises || []
    const chartData: ChartData[] = []
    filteredWorkoutData.forEach(workout => {
      workout.exercises.forEach(exercise => {
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
    filteredWorkoutData.forEach(workout => {
      workout.exercises.forEach(exercise => {
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

  const formatChartData = (data: ChartData[], isMobile: boolean) => {
    if (chartType === "total-volume") {
      return {
        xAxis: [{
          scaleType: 'time' as const,
          valueFormatter: (value: number) => {
            const date = new Date(value)
            return isMobile 
              ? `${date.getMonth() + 1}/${date.getDate()}`
              : date.toLocaleDateString()
          }
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
          valueFormatter: (value: number) => {
            const date = new Date(value)
            return isMobile 
              ? `${date.getMonth() + 1}/${date.getDate()}`
              : date.toLocaleDateString()
          }
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

  // Calculate average percent increase for the displayed chart data
  function getAveragePercentIncrease(chartData: ChartData[]): number | null {
    if (!chartData || chartData.length < 2) return null;
    // Sort by date in case data is not sorted
    const sorted = [...chartData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0].volume;
    const last = sorted[sorted.length - 1].volume;
    if (first === 0) return null;
    return ((last - first) / Math.abs(first)) * 100;
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
  const chartConfig = formatChartData(chartData, isMobile)
  const avgPercentIncrease = getAveragePercentIncrease(chartData)
  
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

        {/* Chart and Timeframe Dropdowns */}
        <div className="mb-4 flex flex-col sm:flex-row justify-center gap-2 sm:gap-6 dark:bg-black">
          <div className="inline-flex items-center gap-2 flex-col sm:flex-row">
            <label className="text-sm font-medium">Chart:</label>
            <select
              value={dropdownValue}
              onChange={(e) => setDropdownValue(e.target.value)}
              className="input-apple text-sm rounded-none min-w-[200px] sm:min-w-[250px]"
              style={{ borderRadius: 0 }}
            >
              {chartOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="inline-flex items-center gap-2 flex-col sm:flex-row">
            <label className="text-sm font-medium">Period:</label>
            <select
              value={timeframeValue}
              onChange={(e) => setTimeframeValue(e.target.value)}
              className="input-apple text-sm rounded-none min-w-[200px] sm:min-w-[250px]"
              style={{ borderRadius: 0 }}
            >
              <option value="all">All Time</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="ytd">Year to Date</option>
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
              <option value="prev-year">{currentYear - 1}</option>
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white border-2 border-gray-200 rounded-none p-4 sm:p-8">
          <div className="h-64 sm:h-96">
            <ScatterChart
              xAxis={chartConfig.xAxis}
              series={chartConfig.series}
              height={chartHeight}
              margin={margins}
              tooltip={{ trigger: 'none' }}
            />
          </div>
          {/* Average Percent Increase Display */}
          <div className="text-center mt-2 text-sm text-black dark:text-black">
            {avgPercentIncrease !== null && (
              <span>
                Percent Increase: {avgPercentIncrease > 0 ? '+' : ''}{avgPercentIncrease.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
          <div className="card-apple text-center dark:bg-black" style={{ borderRadius: 0 }}>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Total Workouts</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-800">
              {workoutData.length}
            </p>
          </div>
          <div className="card-apple text-center dark:bg-black" style={{ borderRadius: 0 }}>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Total Volume</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-800">
              {workoutData.reduce((total, workout) => total + workout.total_volume, 0).toLocaleString()} lbs
            </p>
          </div>
          <div className="card-apple text-center sm:col-span-2 lg:col-span-1 dark:bg-black" style={{ borderRadius: 0 }}>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Avg Volume/Workout</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-800">
              {Math.round(workoutData.reduce((total, workout) => total + workout.total_volume, 0) / workoutData.length).toLocaleString()} lbs
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 