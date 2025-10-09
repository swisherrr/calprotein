"use client"

import { useState, useEffect } from "react"
import { LineChart } from "@mui/x-charts/LineChart"
import { supabase } from "@/lib/supabase"
import { EXERCISE_GROUPS, getCombinedExerciseGroups } from "@/lib/exercises"
import { useCustomExercises } from "@/hooks/use-custom-exercises"
import { startOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears, isSameMonth, isSameYear, isWithinInterval, parseISO } from 'date-fns'
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { BodyMeasurementsLogger } from "./body-measurements-logger"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface WorkoutData {
  id: string
  date: string
  total_volume: number
  exercises: Array<{
    name: string
    volume: number
    setData?: Array<{
      reps?: number
      weight?: number
    }>
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

// Function to get margins based on whether legend is shown
function getChartMargins(isMobile: boolean, shouldHideLegend: boolean) {
  if (shouldHideLegend) {
    return {
      top: 20,
      bottom: isMobile ? 50 : 30,
      left: isMobile ? 50 : 40,
      right: isMobile ? 30 : 20
    }
  }
  // Extra bottom margin for legend
  return {
    top: 20,
    bottom: isMobile ? 90 : 80,
    left: isMobile ? 50 : 40,
    right: isMobile ? 30 : 20
  }
}

// Calculate estimated 1RM using Epley formula
function calculateEstimated1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps === 0 || weight === 0) return 0
  return weight * (1 + reps / 30)
}

// Get the best estimated 1RM from all sets in an exercise
function getBestEstimated1RM(setData: Array<{ reps?: number; weight?: number }>): number {
  let best1RM = 0
  for (const set of setData) {
    if (set.weight && set.reps) {
      const estimated = calculateEstimated1RM(set.weight, set.reps)
      if (estimated > best1RM) {
        best1RM = estimated
      }
    }
  }
  return best1RM
}

export function WorkoutAnalytics() {
  const [showBodyMeasurements, setShowBodyMeasurements] = useState(false)
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([])
  const [loading, setLoading] = useState(true)
  const { chartHeight, margins, isMobile } = useResponsiveDimensions()
  const { customExercises } = useCustomExercises()

  // Define mapping from specific muscle group to broad group
  const MUSCLE_GROUP_TO_BROAD: Record<string, string> = {
    // Arms
    Bicep: 'Arms',
    Tricep: 'Arms',
    Forearm: 'Arms',
    // Legs
    Quadriceps: 'Legs',
    Hamstrings: 'Legs',
    Glutes: 'Legs',
    Adductors: 'Legs',
    Abductors: 'Legs',
    Calves: 'Legs',
    // Chest
    Chest: 'Chest',
    // Back
    Lats: 'Back',
    'Upper Back': 'Back',
    'Lower Back': 'Back',
    Traps: 'Back',
    // Shoulders
    Shoulders: 'Shoulders',
    // Core
    Core: 'Core',
    // Cardio
    Cardio: 'Cardio',
    // Other
    Other: 'Other',
  };

  // Single dropdown options
  const chartOptions = [
    { value: 'total-volume', label: 'Overall Progress' },
    { value: 'all-exercises', label: 'All Exercises' },
  ]

  // Build grouped chart options for muscle groups
  const combinedGroups = getCombinedExerciseGroups(customExercises);
  const broadGroups: Record<string, { label: string; options: { value: string; label: string }[] }> = {};
  for (const group of combinedGroups) {
    const broad = MUSCLE_GROUP_TO_BROAD[group.label] || group.label;
    if (!broadGroups[broad]) {
      broadGroups[broad] = { label: broad, options: [] };
    }
    broadGroups[broad].options.push({
      value: `muscle-group:${group.label}`,
      label: group.label,
    });
  }

  // State for chart type and muscle group
  const [chartType, setChartType] = useState<'total-volume' | 'muscle-groups' | 'all-exercises'>('total-volume')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("")
  const [dropdownValue, setDropdownValue] = useState('total-volume')
  const [timeframeValue, setTimeframeValue] = useState('all')
  const [metricType, setMetricType] = useState<'volume' | '1rm'>('volume')
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
  }, [customExercises])

  const loadWorkoutData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, date, total_volume, exercises')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .limit(100) // Limit to recent 100 workout logs for performance

      if (error) throw error

      // Ensure exercises have setData (it should be included in the jsonb column)
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
    if (metricType === 'volume') {
      return filteredWorkoutData
        .filter(workout => workout.total_volume > 0) // Filter out workouts with 0 volume
        .map(workout => ({
          date: workout.date,
          volume: workout.total_volume
        }))
    } else {
      // For 1RM, calculate the sum of best 1RMs for all exercises in each workout
      return filteredWorkoutData
        .map(workout => {
          let total1RM = 0
          workout.exercises.forEach(exercise => {
            if (exercise.setData && exercise.setData.length > 0) {
              total1RM += getBestEstimated1RM(exercise.setData)
            }
          })
          return {
            date: workout.date,
            volume: total1RM
          }
        })
        .filter(data => data.volume > 0)
    }
  }
  const getMuscleGroupData = (): ChartData[] => {
    if (!selectedMuscleGroup) return []
    const combinedGroups = getCombinedExerciseGroups(customExercises)
    const exercisesInGroup = combinedGroups.find(group => group.label === selectedMuscleGroup)?.exercises || []
    const chartData: ChartData[] = []
    filteredWorkoutData.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercisesInGroup.includes(exercise.name)) {
          let value = 0
          if (metricType === 'volume') {
            value = exercise.volume || 0
          } else {
            // For 1RM, get the best estimated 1RM from setData
            if (exercise.setData && exercise.setData.length > 0) {
              value = getBestEstimated1RM(exercise.setData)
            }
          }
          if (value > 0) {
            chartData.push({
              date: workout.date,
              volume: value,
              exercise: exercise.name
            })
          }
        }
      })
    })
    return chartData
  }
  const getAllExercisesData = (): ChartData[] => {
    const chartData: ChartData[] = []
    filteredWorkoutData.forEach(workout => {
      workout.exercises.forEach(exercise => {
        let value = 0
        if (metricType === 'volume') {
          value = exercise.volume || 0
        } else {
          // For 1RM, get the best estimated 1RM from setData
          if (exercise.setData && exercise.setData.length > 0) {
            value = getBestEstimated1RM(exercise.setData)
          }
        }
        if (value > 0) {
          chartData.push({
            date: workout.date,
            volume: value,
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
    // Sort data by date to ensure proper line connections
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const yAxisLabel = metricType === 'volume' 
      ? 'Volume (lbs)' 
      : 'Estimated 1RM (lbs)'
    
    if (chartType === "total-volume") {
      return {
        xAxis: [{
          scaleType: 'time' as const,
          data: sortedData.map(d => new Date(d.date).getTime()),
          valueFormatter: (value: number) => {
            const date = new Date(value)
            return isMobile 
              ? `${date.getMonth() + 1}/${date.getDate()}`
              : date.toLocaleDateString()
          }
        }],
        series: [{
          label: metricType === 'volume' ? 'Total Volume (lbs)' : 'Total Est. 1RM (lbs)',
          data: sortedData.map(d => d.volume),
          color: '#3b82f6'
        }]
      }
    } else {
      const exercises = getUniqueExercises(sortedData);
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
      
      // Get all unique dates for x-axis
      const allDates = [...new Set(sortedData.map(d => d.date))].sort();
      
      return {
        xAxis: [{
          scaleType: 'time' as const,
          data: allDates.map(d => new Date(d).getTime()),
          valueFormatter: (value: number) => {
            const date = new Date(value)
            return isMobile 
              ? `${date.getMonth() + 1}/${date.getDate()}`
              : date.toLocaleDateString()
          }
        }],
        series: exercises.map((exercise, index) => {
          // Create a map of date to volume for this exercise
          const exerciseDataMap = new Map();
          sortedData
            .filter(d => d.exercise === exercise)
            .forEach(d => {
              exerciseDataMap.set(d.date, d.volume);
            });
          
          // Map volumes to the same order as x-axis dates, filling gaps with null
          const exerciseData = allDates.map(date => exerciseDataMap.get(date) || null);
          
          return {
            label: exercise,
            data: exerciseData,
            color: colors[index % colors.length]
          };
        })
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

  // Helper to get label for current value
  const getChartLabel = (value: string) => {
    if (value === 'total-volume') return 'Overall Progress';
    if (value === 'all-exercises') return 'All Exercises';
    for (const broad of Object.values(broadGroups)) {
      const found = broad.options.find(opt => opt.value === value);
      if (found) return found.label;
    }
    return 'Select chart...';
  };
  const getPeriodLabel = (value: string) => {
    if (value === 'all') return 'All Time';
    if (value === 'week') return 'Past Week';
    if (value === 'month') return 'Past Month';
    if (value === 'ytd') return 'Year to Date';
    if (value === 'prev-year') return `${currentYear - 1}`;
    const found = monthOptions.find(opt => opt.value === value);
    if (found) return found.label;
    return 'Select period...';
  };

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
  
  // Determine if legend should be hidden based on number of series
  const shouldHideLegend = chartType === "all-exercises" || chartConfig.series.length > 4
  const chartMargins = getChartMargins(isMobile, shouldHideLegend)
  

  return (
    <div className="container-apple section-apple">
      <div className="animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="mb-4">Workout Analytics</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-light">
            Track your strength progression and volume over time
          </p>
        </div>

        {/* Chart, Timeframe, and Metric Dropdowns */}
        <div className="mb-4 flex flex-col sm:flex-row justify-center gap-2 sm:gap-6 dark:bg-black">
          <Select.Root value={dropdownValue} onValueChange={setDropdownValue} defaultValue={dropdownValue || 'total-volume'}>
            <Select.Trigger className="min-w-[200px] w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-between">
              <Select.Value>{getChartLabel(dropdownValue)}</Select.Value>
              <Select.Icon>
                <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Content position="popper" sideOffset={4} className="z-50 min-w-[200px] bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
              <Select.Viewport>
                <Select.Item value="total-volume" className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">Overall Progress</Select.Item>
                <Select.Item value="all-exercises" className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">All Exercises</Select.Item>
                {Object.values(broadGroups).map(broad => (
                  <Select.Group key={broad.label}>
                    <Select.Label className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{broad.label}</Select.Label>
                    {broad.options.map(opt => (
                      <Select.Item key={opt.value} value={opt.value} className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">
                        {opt.label}
                      </Select.Item>
                    ))}
                  </Select.Group>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Root>
          <Select.Root value={timeframeValue} onValueChange={setTimeframeValue} defaultValue={timeframeValue || 'all'}>
            <Select.Trigger className="min-w-[200px] w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-between">
              <Select.Value>{getPeriodLabel(timeframeValue)}</Select.Value>
              <Select.Icon>
                <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Content position="popper" sideOffset={4} className="z-50 min-w-[200px] bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
              <Select.Viewport>
                <Select.Item value="all" className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">All Time</Select.Item>
                <Select.Item value="week" className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">Past Week</Select.Item>
                <Select.Item value="month" className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">Past Month</Select.Item>
                <Select.Item value="ytd" className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">Year to Date</Select.Item>
                {monthOptions.map(opt => (
                  <Select.Item key={opt.value} value={opt.value} className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">{opt.label}</Select.Item>
                ))}
                <Select.Item value="prev-year" className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">{currentYear - 1}</Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Root>
          <Select.Root value={metricType} onValueChange={(value) => setMetricType(value as 'volume' | '1rm')}>
            <Select.Trigger className="min-w-[200px] w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-between">
              <Select.Value>{metricType === 'volume' ? 'Volume' : '1RM (Epley)'}</Select.Value>
              <Select.Icon>
                <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Content position="popper" sideOffset={4} className="z-50 min-w-[200px] bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
              <Select.Viewport>
                <Select.Item value="volume" className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">Volume</Select.Item>
                <Select.Item value="1rm" className="px-3 py-2 cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">1RM (Epley)</Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Root>
        </div>

        {/* Chart */}
        <div className="bg-white border-2 border-gray-200 rounded-none p-4 sm:p-8">
          <div className="h-64 sm:h-96">
            <LineChart
              xAxis={chartConfig.xAxis}
              series={chartConfig.series}
              height={chartHeight}
              margin={chartMargins}
              tooltip={{ 
                trigger: 'item',
                slotProps: {
                  popper: {
                    sx: {
                      '& .MuiTooltip-tooltip': {
                        backgroundColor: 'rgba(0, 0, 0, 0.87)',
                        color: 'white',
                        fontSize: '12px',
                        padding: '8px 12px',
                        borderRadius: '4px'
                      }
                    }
                  }
                }
              }}
              slotProps={{
                legend: {
                  hidden: shouldHideLegend,
                  direction: 'row',
                  position: { vertical: 'bottom', horizontal: 'middle' },
                  padding: 0,
                  itemMarkWidth: 10,
                  itemMarkHeight: 10,
                  markGap: 5,
                  itemGap: 10,
                  labelStyle: {
                    fontSize: isMobile ? 10 : 12,
                  }
                }
              }}
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
              {workoutData.filter(workout => workout.total_volume > 0).length}
            </p>
          </div>
          <div className="card-apple text-center dark:bg-black" style={{ borderRadius: 0 }}>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Total Volume</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-800">
              {workoutData.filter(workout => workout.total_volume > 0).reduce((total, workout) => total + workout.total_volume, 0).toLocaleString()} lbs
            </p>
          </div>
          <div className="card-apple text-center sm:col-span-2 lg:col-span-1 dark:bg-black" style={{ borderRadius: 0 }}>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Avg Volume/Workout</h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-800">
              {(() => {
                const validWorkouts = workoutData.filter(workout => workout.total_volume > 0);
                return validWorkouts.length > 0 
                  ? Math.round(validWorkouts.reduce((total, workout) => total + workout.total_volume, 0) / validWorkouts.length).toLocaleString()
                  : '0';
              })()} lbs
            </p>
          </div>
        </div>

        {/* Body Measurements Section */}
        <div className="mt-8">
          <div className="text-center mb-4">
            <Button 
              onClick={() => setShowBodyMeasurements(!showBodyMeasurements)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              <Plus className={`w-5 h-5 mr-2 transition-transform ${showBodyMeasurements ? 'rotate-45' : ''}`} />
              {showBodyMeasurements ? 'Hide Body Measurements' : 'Log Body Measurements'}
            </Button>
          </div>

          {/* Expandable Body Measurements Form */}
          {showBodyMeasurements && (
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6 mt-4">
              <BodyMeasurementsLogger onClose={() => setShowBodyMeasurements(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 