"use client"

import { useEntries } from "@/hooks/use-entries"
import { useUserSettings } from "@/hooks/use-user-settings"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type DayData = {
  date: Date
  calories: number
  protein: number
  percentage: number
}

export function ContributionCalendar() {
  const { entries } = useEntries()
  const { settings } = useUserSettings()
  
  // Process entries into a map of dates
  const getDayData = (): DayData[] => {
    const days: DayData[] = []
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 364) // Last 365 days
    
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
    
    // Fill in all dates
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateString = d.toDateString()
      const dayData = entriesByDate[dateString] || { calories: 0, protein: 0 }
      
      // Calculate percentage of goals met (average of calories and protein)
      const caloriePercent = Math.min(100, (dayData.calories / settings.daily_calories) * 100)
      const proteinPercent = Math.min(100, (dayData.protein / settings.daily_protein) * 100)
      const percentage = (caloriePercent + proteinPercent) / 2
      
      days.push({
        date: new Date(d),
        calories: dayData.calories,
        protein: dayData.protein,
        percentage
      })
    }
    
    return days
  }

  const getColorForPercentage = (percentage: number, calories: number): string => {
    // If no entries that day
    if (percentage === 0) return 'bg-gray-100 dark:bg-gray-800'
    
    // If calories are over goal
    if (calories > settings.daily_calories) {
      const overagePercent = Math.min((calories - settings.daily_calories) / settings.daily_calories, 1)
      if (overagePercent < 0.25) return 'bg-red-300 dark:bg-red-800'
      if (overagePercent < 0.5) return 'bg-red-400 dark:bg-red-700'
      if (overagePercent < 0.75) return 'bg-red-500 dark:bg-red-600'
      return 'bg-red-600 dark:bg-red-500'
    }
    
    // Normal green progression for under/at goal
    if (percentage < 25) return 'bg-green-100 dark:bg-green-900'
    if (percentage < 50) return 'bg-green-300 dark:bg-green-700'
    if (percentage < 75) return 'bg-green-500 dark:bg-green-500'
    return 'bg-green-700 dark:bg-green-300'
  }

  const days = getDayData()
  const weeks = []
  let currentWeek = []
  
  // Fill weeks from newest to oldest
  for (let i = days.length - 1; i >= 0; i--) {
    currentWeek.unshift(days[i]) // Add to start of week to maintain left-to-right order
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  // Add any remaining days as the last (oldest) week
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Activity</h3>
      <TooltipProvider>
        <div>
          {/* Day labels on top */}
          <div className="flex text-xs text-gray-500">
            <div className="ml-[49px]">M</div>
            <div className="ml-[22px]">W</div>
            <div className="ml-[22px]">F</div>
          </div>

          <div className="flex">
            {/* Month labels on the left */}
            <div className="text-xs text-gray-500 pr-2 text-right w-8">
              {weeks.map((week, i) => {
                const date = week[0].date
                const firstDayOfMonth = date.getDate() <= 7
                if (firstDayOfMonth) {
                  return (
                    <div key={i} className="h-[16px]">
                      {date.toLocaleDateString(undefined, { month: 'short' })}
                    </div>
                  )
                }
                return <div key={i} className="h-[16px]" />
              })}
            </div>

            {/* Calendar grid */}
            <div className="flex flex-col gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex gap-1">
                  {week.map((day) => (
                    <Tooltip key={day.date.toISOString()}>
                      <TooltipTrigger asChild>
                        <div 
                          className={`w-3 h-3 rounded-sm ${getColorForPercentage(day.percentage, day.calories)}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">
                          {day.date.toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs">
                          {day.calories} cal • {day.protein}g protein
                        </p>
                        <p className="text-xs">
                          {Math.round(day.percentage)}% of goals
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
} 