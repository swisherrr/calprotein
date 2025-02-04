"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UsualsSection } from "@/components/dashboard/usuals-section"
import { ManualEntry } from "@/components/dashboard/manual-entry"

export default function DashboardPage() {
  const [totalCalories, setTotalCalories] = useState(0)
  const [totalProtein, setTotalProtein] = useState(0)
  const [entries, setEntries] = useState<Array<{
    name: string
    calories: number
    protein: number
    timestamp: Date
  }>>([])

  const handleUsualsAdd = (calories: number, protein: number) => {
    setTotalCalories(prev => prev + calories)
    setTotalProtein(prev => prev + protein)
    setEntries(prev => [...prev, {
      name: "Multiple items",
      calories,
      protein,
      timestamp: new Date()
    }])
  }

  const handleManualAdd = (name: string, calories: number, protein: number) => {
    setTotalCalories(prev => prev + calories)
    setTotalProtein(prev => prev + protein)
    setEntries(prev => [...prev, {
      name: name || "Unnamed entry",
      calories,
      protein,
      timestamp: new Date()
    }])
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button>Add Entry</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold mb-2">Today's Calories</h2>
          <p className="text-3xl font-bold">{totalCalories} / 2000</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold mb-2">Protein</h2>
          <p className="text-3xl font-bold">{totalProtein}g / 150g</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold mb-2">Recent Entries</h2>
          {entries.length > 0 ? (
            <div className="space-y-2">
              {entries.slice(-3).map((entry, i) => (
                <div key={i} className="text-sm">
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
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{entry.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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