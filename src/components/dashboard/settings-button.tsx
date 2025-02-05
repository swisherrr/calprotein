"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useUserSettings } from "@/hooks/use-user-settings"

export function SettingsButton() {
  const [showModal, setShowModal] = useState(false)
  const { settings, updateSettings } = useUserSettings()
  const [calories, setCalories] = useState(settings.daily_calories.toString())
  const [protein, setProtein] = useState(settings.daily_protein.toString())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateSettings({
        daily_calories: parseInt(calories),
        daily_protein: parseInt(protein)
      })
      setShowModal(false)
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        className="flex items-center"
      >
        <Settings className="h-4 w-4 mr-2" />
        <span>Settings</span>
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Daily Goals</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Daily Calories Target
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Daily Protein Target (g)
                </label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
} 