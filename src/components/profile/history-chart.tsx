"use client"

import { useState, useEffect } from 'react'
import { BarChart } from '@mui/x-charts/BarChart'
import { useEntries } from '@/hooks/use-entries'
import { useUserSettings } from '@/hooks/use-user-settings'

type TimeFrame = '7days' | '30days' | '90days'

export function HistoryChart() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('7days')
  const { entries } = useEntries()
  const { settings } = useUserSettings()
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Check for dark mode on mount and when system preference changes
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(isDark)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Process entries based on timeframe
  const processData = () => {
    const now = new Date()
    const days = timeFrame === '7days' ? 7 : timeFrame === '30days' ? 30 : 90
    const startDate = new Date(now.setDate(now.getDate() - days))

    // Filter entries within timeframe
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= startDate
    })

    // Group by date
    const dailyData = filteredEntries.reduce((acc, entry) => {
      const date = new Date(entry.created_at).toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric'
      })
      if (!acc[date]) {
        acc[date] = { calories: 0, protein: 0 }
      }
      acc[date].calories += entry.calories
      acc[date].protein += entry.protein
      return acc
    }, {} as Record<string, { calories: number; protein: number }>)

    // Convert to arrays for chart and sort by date
    const dates = Object.keys(dailyData).sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateA.getTime() - dateB.getTime() // Ascending order (older to newer)
    })
    const calories = dates.map(date => dailyData[date].calories)
    const protein = dates.map(date => dailyData[date].protein)

    return { dates, calories, protein }
  }

  const { dates, calories, protein } = processData()

  const chartProps = {
    width: undefined as any,
    height: 300,
    sx: {
      '.MuiChartsLegend-mark': {
        rx: '50%',
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">History</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFrame('7days')}
            className={`px-3 py-1 rounded-md ${
              timeFrame === '7days' 
                ? 'bg-foreground text-background' 
                : 'border border-foreground'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeFrame('30days')}
            className={`px-3 py-1 rounded-md ${
              timeFrame === '30days' 
                ? 'bg-foreground text-background' 
                : 'border border-foreground'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeFrame('90days')}
            className={`px-3 py-1 rounded-md ${
              timeFrame === '90days' 
                ? 'bg-foreground text-background' 
                : 'border border-foreground'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Daily Calories</h3>
          <div className="h-[300px] w-full">
            <BarChart
              {...chartProps}
              margin={{ left: 40, right: 40 }}
              xAxis={[{ 
                scaleType: 'band',
                data: dates,
                tickLabelStyle: {
                  angle: 45,
                  textAnchor: 'start',
                  fill: isDarkMode ? '#fff' : '#000'
                }
              }]}
              yAxis={[{
                scaleType: 'linear',
                max: settings.daily_calories,
                tickLabelStyle: {
                  fill: isDarkMode ? '#fff' : '#000'
                }
              }]}
              series={[{
                data: calories,
                color: '#ef4444',
                valueFormatter: (value) => `${value} cal`
              }]}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Daily Protein</h3>
          <div className="h-[300px] w-full">
            <BarChart
              {...chartProps}
              margin={{ left: 40, right: 40 }}
              xAxis={[{ 
                scaleType: 'band',
                data: dates,
                tickLabelStyle: {
                  angle: 45,
                  textAnchor: 'start',
                  fill: isDarkMode ? '#fff' : '#000'
                }
              }]}
              yAxis={[{
                scaleType: 'linear',
                max: settings.daily_protein,
                tickLabelStyle: {
                  fill: isDarkMode ? '#fff' : '#000'
                }
              }]}
              series={[{
                data: protein,
                color: '#3b82f6',
                valueFormatter: (value) => `${value}g`
              }]}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 