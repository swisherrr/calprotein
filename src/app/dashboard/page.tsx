"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Pen } from "lucide-react"
import { UsualsSection } from "@/components/dashboard/usuals-section"
import { ManualEntry } from "@/components/dashboard/manual-entry"
import { useEntries } from "@/hooks/use-entries"
import { useUserSettings } from "@/hooks/use-user-settings"
import { SettingsButton } from "@/components/dashboard/settings-button"

export default function DashboardPage() {
  const { entries, loading: entriesLoading, addEntry } = useEntries()
  const { settings, loading: settingsLoading, updateSettings } = useUserSettings()
  const [editingCalories, setEditingCalories] = useState(false)
  const [editingProtein, setEditingProtein] = useState(false)
  
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

  if (entriesLoading || settingsLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <SettingsButton />
          <Button>Add Entry</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-6 border rounded-lg relative">
          <button 
            onClick={() => setEditingCalories(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <Pen className="h-4 w-4" />
          </button>
          <h2 className="font-semibold mb-2">Today's Calories</h2>
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
        
        <div className="p-6 border rounded-lg relative">
          <button 
            onClick={() => setEditingProtein(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <Pen className="h-4 w-4" />
          </button>
          <h2 className="font-semibold mb-2">Protein</h2>
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
        
        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold mb-2">Recent Entries</h2>
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

      <div className="border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Today's Log</h2>
        {todayEntries.length > 0 ? (
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="flex justify-between items-center">
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
        ) : (
          <p className="text-gray-500">No meals logged today</p>
        )}
      </div>
    </div>
  )
} 