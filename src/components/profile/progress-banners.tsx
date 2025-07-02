"use client"

import { useEntries } from "@/hooks/use-entries"
import { useUserSettings } from "@/hooks/use-user-settings"

export function ProgressBanners() {
  const { entries } = useEntries()
  const { settings, loading } = useUserSettings()
  
  // Don't render until settings are loaded
  if (loading || !settings) {
    return (
      <div className="space-y-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="flex-1 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="flex-1 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    )
  }
  
  // Get data for the last 100 days
  const getHistoricalData = () => {
    const days = []
    const today = new Date()
    
    // Create map of entries by date
    const entriesByDate = entries.reduce((acc, entry) => {
      const date = new Date(entry.created_at).toDateString()
      if (!acc[date]) {
        acc[date] = { calories: 0, protein: 0 }
      }
      acc[date].calories += entry.calories
      acc[date].protein += entry.protein
      return acc
    }, {} as Record<string, { calories: number, protein: number }>)
    
    // Generate data for last 100 days
    for (let i = 99; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toDateString()
      const dayData = entriesByDate[dateString] || { calories: 0, protein: 0 }
      
      days.push({
        date,
        calories: dayData.calories,
        protein: dayData.protein
      })
    }
    
    return days
  }

  const days = getHistoricalData()
  
  // Calculate color for a single day
  const getCalorieColor = (calories: number) => {
    if (calories === 0) return 'bg-gray-200 dark:bg-gray-700' // No entries
    const calorieDiff = Math.abs(calories - settings.daily_calories)
    if (calorieDiff <= 50) return 'bg-green-600 dark:bg-green-500' // Within 50 calories
    if (calorieDiff <= 150) return 'bg-green-400 dark:bg-green-600' // Within 150 calories
    return 'bg-gray-300 dark:bg-gray-600' // Outside range
  }
  
  const getProteinColor = (protein: number) => {
    if (protein === 0) return 'bg-gray-200 dark:bg-gray-700' // No entries
    const proteinDiff = settings.daily_protein - protein
    if (protein >= settings.daily_protein) return 'bg-blue-600 dark:bg-blue-500' // At or above target
    if (proteinDiff <= 10) return 'bg-blue-400 dark:bg-blue-600' // Within 10g under target
    return 'bg-gray-300 dark:bg-gray-600' // More than 10g under target
  }

  // Create banner boxes - one box per day
  const createBannerBoxes = (days: any[], getColorFn: (value: number) => string) => {
    return days.map((day, i) => (
      <div 
        key={i} 
        className={`flex-1 h-3 rounded-sm ${getColorFn(day.calories || day.protein)} transition-colors duration-200`}
        title={`${day.date.toLocaleDateString()}: ${day.calories} cal, ${day.protein}g protein`}
      />
    ))
  }

  const calorieBoxes = createBannerBoxes(days, getCalorieColor)
  const proteinBoxes = createBannerBoxes(days, getProteinColor)

  return (
    <div className="space-y-2">
      {/* Calorie Banner */}
      <div className="flex gap-0.5">
        {calorieBoxes}
      </div>
      
      {/* Protein Banner */}
      <div className="flex gap-0.5">
        {proteinBoxes}
      </div>
    </div>
  )
} 