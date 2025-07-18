"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/components/providers/theme-provider"
import { Moon, Sun, Monitor } from "lucide-react"

interface ThemeOption {
  value: 'light' | 'dark' | 'system'
  label: string
  icon: React.ReactNode
  description: string
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: <Sun className="h-4 w-4" />,
    description: 'Always use light mode'
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <Moon className="h-4 w-4" />,
    description: 'Always use dark mode'
  },
  {
    value: 'system',
    label: 'System',
    icon: <Monitor className="h-4 w-4" />,
    description: 'Follow system preference'
  }
]

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="space-y-3">
        {themeOptions.map((option) => (
          <div
            key={option.value}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {option.icon}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {option.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-3">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors duration-200 ${
            theme === option.value
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-md ${
              theme === option.value
                ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {option.icon}
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {option.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {option.description}
              </div>
            </div>
          </div>
          {theme === option.value && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
} 