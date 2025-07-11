"use client"

import { useEffect, useState } from "react"
import { useDemo } from "@/components/providers/demo-provider"

function SettingToggle({ 
  label, 
  description, 
  value, 
  onChange 
}: { 
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void 
}) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="flex-1 pr-4">
        <span className="text-base text-gray-800 dark:text-gray-200 font-medium block mb-1">{label}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{description}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 flex items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        style={{ boxShadow: 'none', border: 'none', padding: 0 }}
        aria-pressed={value}
        type="button"
      >
        <span
          className={`inline-block w-5 h-5 transform bg-white dark:bg-black rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-1'}`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { isDemoMode } = useDemo()
  const [autoLoadReps, setAutoLoadReps] = useState(false)
  const [autoLoadWeight, setAutoLoadWeight] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    setAutoLoadReps(localStorage.getItem('autoLoadReps') === 'true')
    setAutoLoadWeight(localStorage.getItem('autoLoadWeight') === 'true')
  }, [])

  const handleToggleReps = (v: boolean) => {
    setAutoLoadReps(v)
    localStorage.setItem('autoLoadReps', v ? 'true' : 'false')
  }

  const handleToggleWeight = (v: boolean) => {
    setAutoLoadWeight(v)
    localStorage.setItem('autoLoadWeight', v ? 'true' : 'false')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Customize your workout experience and app preferences.
        </p>
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Workout Settings</h2>
        
        <SettingToggle 
          label="Auto load reps" 
          description="When enabled, entering reps in the first set will automatically fill the same number of reps for all remaining sets in that exercise."
          value={autoLoadReps} 
          onChange={handleToggleReps} 
        />
        
        <SettingToggle 
          label="Auto load weight" 
          description="When enabled, entering weight in the first set will automatically fill the same weight for all remaining sets in that exercise."
          value={autoLoadWeight} 
          onChange={handleToggleWeight} 
        />
      </div>

      {isDemoMode && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You're currently in demo mode. Settings will be saved locally and reset when you exit demo mode.
          </p>
        </div>
      )}
    </div>
  )
} 