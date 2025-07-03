"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Pen } from "lucide-react"
import { UsualsSection } from "@/components/dashboard/usuals-section"
import { ManualEntry } from "@/components/dashboard/manual-entry"
import { useEntries, Entry } from "@/hooks/use-entries"
import { useUserSettings } from "@/hooks/use-user-settings"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"


function calculateGradient(current: number, target: number) {
  const percentage = Math.min((current / target) * 100, 100)
  if (percentage === 0) return 'rgb(0, 255, 0)' // All green
  if (percentage === 100) return 'rgb(239, 68, 68)' // All red
  
  // Calculate the gradient stop point
  const gradientStop = Math.round(percentage)
  return `linear-gradient(90deg, 
    rgb(34, 197, 94) 0%, 
    rgb(34, 197, 94) ${100 - gradientStop}%, 
    rgb(239, 68, 68) ${100 - gradientStop}%, 
    rgb(239, 68, 68) 100%)`
}

export default function DashboardPage() {
  const { entries, loading: entriesLoading, addEntry } = useEntries()
  const { settings, loading: settingsLoading, updateSettings } = useUserSettings()
  const [editingCalories, setEditingCalories] = useState(false)
  const [editingProtein, setEditingProtein] = useState(false)
  const [showAllEntries, setShowAllEntries] = useState(false)
  
  // Update state when settings change
  const [newCalories, setNewCalories] = useState(settings?.daily_calories?.toString() || "2000")
  const [newProtein, setNewProtein] = useState(settings?.daily_protein?.toString() || "150")

  useEffect(() => {
    if (settings) {
      setNewCalories(settings.daily_calories.toString())
      setNewProtein(settings.daily_protein.toString())
    }
  }, [settings])
  
  // Calculate totals from entries for today only
  const todayEntries = entries.filter(entry => {
    const entryDate = new Date(entry.created_at)
    const today = new Date()
    return entryDate.toDateString() === today.toDateString()
  })
  
  const totalCalories = todayEntries.reduce((sum, entry) => sum + entry.calories, 0)
  const totalProtein = todayEntries.reduce((sum, entry) => sum + entry.protein, 0)

  const handleUsualsAdd = async (calories: number, protein: number, name: string) => {
    try {
      await addEntry({
        name: name,
        calories,
        protein
      })
    } catch (error) {
      console.error('Failed to add usuals:', error)
    }
  }

  const handleManualAdd = async (name: string, calories: number, protein: number) => {
    try {
      await addEntry({
        name: name || "Unnamed entry",
        calories,
        protein
      })
    } catch (error) {
      console.error('Failed to add manual entry:', error)
    }
  }

  const handleCaloriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateSettings({ daily_calories: parseInt(newCalories) })
      setEditingCalories(false)
    } catch (error) {
      console.error('Failed to update calories:', error)
    }
  }

  const handleProteinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateSettings({ daily_protein: parseInt(newProtein) })
      setEditingProtein(false)
    } catch (error) {
      console.error('Failed to update protein:', error)
    }
  }

  const handleReset = async (entries: Entry[], addEntry: (entry: any) => Promise<any>) => {
    try {
      // Add a negative entry that cancels out all today's entries
      const totalCals = entries.reduce((sum, entry) => sum + entry.calories, 0)
      const totalProt = entries.reduce((sum, entry) => sum + entry.protein, 0)
      
      if (totalCals > 0 || totalProt > 0) {
        await addEntry({
          name: "Reset",
          calories: -totalCals,
          protein: -totalProt
        })
      }
    } catch (error) {
      console.error('Failed to reset:', error)
    }
  }

  if (entriesLoading || settingsLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/profile">
          <Button variant="outline" className="font-medium">
            Data
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div 
              className="p-6 relative bg-gray-800/50 inset-1"
              style={{
                '--progress-gradient': calculateGradient(totalCalories, settings.daily_calories)
              } as any}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-semibold">Today's Calories</h2>
                <div className="flex gap-2">
                  {totalCalories > 0 && (
                    <button
                      onClick={() => handleReset(todayEntries, addEntry)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      Reset
                    </button>
                  )}
                  <button 
                    onClick={() => setEditingCalories(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Pen className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-3xl font-bold">
                {totalCalories} / {editingCalories ? (
                  <form onSubmit={handleCaloriesSubmit} className="inline">
                    <input
                      type="number"
                      value={newCalories}
                      onChange={(e) => setNewCalories(e.target.value)}
                      className="w-24 rounded-md border px-2 py-1 text-lg bg-white dark:bg-gray-900 dark:border-gray-700"
                      autoFocus
                      onBlur={handleCaloriesSubmit}
                    />
                  </form>
                ) : settings.daily_calories}
              </p>
            </div>
            
            <div className="p-6 relative bg-gray-800/50 inset-1">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-semibold">Protein</h2>
                <div className="flex gap-2">
                  {totalProtein > 0 && (
                    <button
                      onClick={() => handleReset(todayEntries, addEntry)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      Reset
                    </button>
                  )}
                  <button 
                    onClick={() => setEditingProtein(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Pen className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-3xl font-bold">
                {totalProtein}g / {editingProtein ? (
                  <form onSubmit={handleProteinSubmit} className="inline">
                    <input
                      type="number"
                      value={newProtein}
                      onChange={(e) => setNewProtein(e.target.value)}
                      className="w-24 rounded-md border px-2 py-1 text-lg bg-white dark:bg-gray-900 dark:border-gray-700"
                      autoFocus
                      onBlur={handleProteinSubmit}
                    />
                  </form>
                ) : `${settings.daily_protein}g`}
              </p>
            </div>
            
            <div className="p-6 bg-gray-800/50 inset-1">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold">Recent Entries</h2>
                {todayEntries.length > 0 && (
                  <Dialog open={showAllEntries} onOpenChange={setShowAllEntries}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        See All
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[80vh] bg-white dark:bg-gray-900">
                      <DialogHeader>
                        <DialogTitle>Today's Entries</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
                        {todayEntries.map((entry) => (
                          <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800">
                            <div>
                              <span className="font-medium">{entry.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {new Date(entry.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {entry.calories}cal • {entry.protein}g protein
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {todayEntries.length > 0 ? (
                <div className="space-y-2">
                  {todayEntries.slice(-3).map((entry) => (
                    <div key={entry.id} className="text-sm">
                      {entry.name}: {entry.calories}cal, {entry.protein}g protein
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No entries yet</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <UsualsSection onAdd={handleUsualsAdd} />
            <ManualEntry onAdd={handleManualAdd} />
          </div>
      </div>
    </div>
  )
} 