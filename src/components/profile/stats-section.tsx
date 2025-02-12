"use client"

import { useEntries } from "@/hooks/use-entries"
import { useUserSettings } from "@/hooks/use-user-settings"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

export function StatsSection() {
  const { entries } = useEntries()
  const { settings } = useUserSettings()

  const calculateStats = () => {
    // Sort entries by date
    const entriesByDate = entries.reduce((acc, entry) => {
      const date = new Date(entry.created_at).toDateString()
      if (!acc[date]) {
        acc[date] = { calories: 0, protein: 0 }
      }
      acc[date].calories += entry.calories
      acc[date].protein += entry.protein
      return acc
    }, {} as Record<string, { calories: number, protein: number }>)

    // Calculate perfect days (both goals met, not exceeded)
    const perfectDays = Object.entries(entriesByDate).filter(([_, data]) => {
      const proteinMet = data.protein >= settings.daily_protein
      const caloriesUnder = data.calories <= settings.daily_calories
      return proteinMet && caloriesUnder
    }).length

    // Calculate current streak
    let currentStreak = 0
    const today = new Date().toDateString()
    let currentDate = new Date()

    while (true) {
      const dateStr = currentDate.toDateString()
      const dayData = entriesByDate[dateStr]
      
      if (!dayData || 
          dayData.calories < settings.daily_calories * 0.9 || 
          dayData.protein < settings.daily_protein * 0.9) {
        break
      }
      
      currentStreak++
      currentDate.setDate(currentDate.getDate() - 1)
      
      // Break if we're looking too far back
      if (currentStreak > 365) break
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    const dates = Object.keys(entriesByDate).sort()
    
    for (let i = 0; i < dates.length; i++) {
      const dayData = entriesByDate[dates[i]]
      const isGoodDay = dayData.calories >= settings.daily_calories * 0.9 && 
                       dayData.protein >= settings.daily_protein * 0.9

      if (isGoodDay) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Calculate last 30 days success rate
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toDateString()
    })

    const successfulDays = last30Days.filter(date => {
      const dayData = entriesByDate[date]
      return dayData && 
             dayData.calories >= settings.daily_calories * 0.9 && 
             dayData.protein >= settings.daily_protein * 0.9
    }).length

    const monthlyRate = Math.round((successfulDays / 30) * 100)

    return {
      currentStreak,
      longestStreak,
      perfectDays,
      monthlyRate
    }
  }

  const stats = calculateStats()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <TooltipProvider>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-1">
            <h3 className="text-sm text-gray-500">Current Streak</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 opacity-50 hover:opacity-100" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px]">Number of consecutive days you've hit at least 90% of both your calorie and protein goals</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-2xl font-bold">{stats.currentStreak} days</p>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-1">
            <h3 className="text-sm text-gray-500">Longest Streak</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 opacity-50 hover:opacity-100" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px]">Your longest streak of consecutive days hitting at least 90% of your goals</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-2xl font-bold">{stats.longestStreak} days</p>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-1">
            <h3 className="text-sm text-gray-500">Perfect Days</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 opacity-50 hover:opacity-100" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px]">Days where you hit or exceeded your protein goal while staying under your calorie goal</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-2xl font-bold">{stats.perfectDays}</p>
        </div>
        
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-1">
            <h3 className="text-sm text-gray-500">30-Day Success Rate</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 opacity-50 hover:opacity-100" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px]">Percentage of days in the last 30 days where you hit at least 90% of your goals</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-2xl font-bold">{stats.monthlyRate}%</p>
        </div>
      </TooltipProvider>
    </div>
  )
} 