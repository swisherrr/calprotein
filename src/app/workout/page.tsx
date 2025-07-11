"use client"

import { useState } from "react"
import { TemplateManager } from "@/components/workout/template-manager"
import { WorkoutLogger } from "@/components/workout/workout-logger"
import { WorkoutAnalytics } from "@/components/workout/workout-analytics"

export default function WorkoutPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "workout" | "data">("workout")

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Workout</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your templates and log your workouts.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-1 inline-flex rounded-lg">
          <button
            onClick={() => setActiveTab("templates")}
            className={`min-w-[110px] sm:min-w-[180px] px-4 sm:px-8 py-2.5 sm:py-3.5 font-medium transition-all duration-200 border-0 text-sm sm:text-base rounded-md ${
              activeTab === "templates"
                ? "bg-gray-100 dark:bg-blue-900 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Manage Templates
          </button>
          <button
            onClick={() => setActiveTab("workout")}
            className={`min-w-[110px] sm:min-w-[180px] px-4 sm:px-8 py-2.5 sm:py-3.5 font-medium transition-all duration-200 border-0 text-sm sm:text-base rounded-md ${
              activeTab === "workout"
                ? "bg-gray-100 dark:bg-blue-900 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Log Workout
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`min-w-[110px] sm:min-w-[180px] px-4 sm:px-8 py-2.5 sm:py-3.5 font-medium transition-all duration-200 border-0 text-sm sm:text-base rounded-md ${
              activeTab === "data"
                ? "bg-gray-100 dark:bg-blue-900 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Data
          </button>
        </div>
      </div>

      {activeTab === "templates" ? (
        <TemplateManager />
      ) : activeTab === "workout" ? (
        <WorkoutLogger />
      ) : (
        <WorkoutAnalytics />
      )}
    </div>
  )
} 