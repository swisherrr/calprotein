import { useState, useCallback } from 'react'

export function useDateNavigation() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

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

  const formatDate = useCallback((date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
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
  }, [])

  const isToday = useCallback((date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }, [])

  const canGoForward = useCallback((date: Date) => {
    return date.toDateString() !== new Date().toDateString()
  }, [])

  return {
    selectedDate,
    goToPreviousDay,
    goToNextDay,
    formatDate,
    isToday,
    canGoForward
  }
}
