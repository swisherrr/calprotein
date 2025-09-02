"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type EntryMode = "simple" | "byWeight"

export function ManualEntry({
  onAdd,
  selectedDate
}: {
  onAdd: (name: string, calories: number, protein: number, date?: Date) => void
  selectedDate: Date
}) {
  const [mode, setMode] = useState<EntryMode>("simple")
  const [name, setName] = useState("")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [servingSize, setServingSize] = useState("")
  const [portion, setPortion] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === "simple") {
      onAdd(
        name,
        Number(calories),
        Number(protein),
        selectedDate
      )
    } else {
      // Calculate proportional calories and protein based on portion
      const ratio = Number(portion) / Number(servingSize)
      onAdd(
        name,
        Math.round(Number(calories) * ratio),
        Math.round(Number(protein) * ratio),
        selectedDate
      )
    }

    // Reset form
    setName("")
    setCalories("")
    setProtein("")
    setServingSize("")
    setPortion("")
  }

  return (
    <div className="p-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
      <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Manual Entry</h2>
      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === "byWeight" ? "default" : "outline"}
          onClick={() => setMode("simple")}
          size="sm"
        >
          Simple
        </Button>
        <Button
          variant={mode === "simple" ? "default" : "outline"}
          onClick={() => setMode("byWeight")}
          size="sm"
        >
          By Weight
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
        />

        {mode === "simple" ? (
          <div className="flex gap-2">
            <input
              placeholder="Calories"
              type="number"
              required
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
            />
            <input
              placeholder="Protein (g)"
              type="number"
              required
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
            />
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                placeholder="Serving Size (g)"
                type="number"
                required
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
              />
              <input
                placeholder="Calories per Serving"
                type="number"
                required
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
              />
              <input
                placeholder="Protein per Serving"
                type="number"
                required
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
              />
            </div>
            <input
              placeholder="Your Portion (g)"
              type="number"
              required
              value={portion}
              onChange={(e) => setPortion(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-gray-100"
            />
          </>
        )}

        <Button type="submit" className="w-full font-medium">
          Add Entry
        </Button>
      </form>
    </div>
  )
} 