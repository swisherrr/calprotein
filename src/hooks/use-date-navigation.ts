import { useState, useCallback } from 'react'

export function useDateNavigation(resetHour: number = 0) {
  // Get the current "day" based on user's reset time
  const getCurrentDay = useCallback((hour: number) => {
    const now = new Date()
    const currentHour = now.getHours()
    
    // If current time is before reset hour, we're still in "yesterday"
    if (currentHour < hour) {
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      return yesterday
    }
    
    return now
  }, [])

  const [selectedDate, setSelectedDate] = useState<Date>(() => getCurrentDay(resetHour))

  // Check if a given date is "today" based on reset time
  const isToday = useCallback((date: Date) => {
    const now = new Date()
    const currentDay = getCurrentDay(resetHour)
    return date.toDateString() === currentDay.toDateString()
  }, [resetHour, getCurrentDay])

  // Check if we can go forward (not beyond current "day")
  const canGoForward = useCallback((date: Date) => {
    const currentDay = getCurrentDay(resetHour)
    return date.toDateString() !== currentDay.toDateString()
  }, [resetHour, getCurrentDay])

  const goToPreviousDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 1)
      return newDate
    })
  }, [])

  const goToNextDay = useCallback(() => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 1)
      return newDate
    })
  }, [])

  const goToCurrentDay = useCallback(() => {
    setSelectedDate(getCurrentDay(resetHour))
  }, [resetHour, getCurrentDay])

  const formatDate = useCallback((date: Date) => {
    const currentDay = getCurrentDay(resetHour)
    const yesterday = new Date(currentDay)
    yesterday.setDate(currentDay.getDate() - 1)
    
    if (date.toDateString() === currentDay.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }, [resetHour, getCurrentDay])

  return {
    selectedDate,
    goToPreviousDay,
    goToNextDay,
    goToCurrentDay,
    formatDate,
    isToday,
    canGoForward,
    getCurrentDay
  }
}
