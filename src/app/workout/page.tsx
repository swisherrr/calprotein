"use client"

import { useState } from "react"
import { TemplateManager } from "@/components/workout/template-manager"
import { WorkoutLogger } from "@/components/workout/workout-logger"
import { WorkoutAnalytics } from "@/components/workout/workout-analytics"

export default function WorkoutPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "workout" | "data">("workout")

  return (
    <div className="container-apple section-apple">
      <div className="animate-fade-in-up">
        {/* Matrix-style Workout Title */}
        {/* Removed workout header with glow/matrix effects */}
        {/* <div className="matrix-container mb-12">
          <h1 className="matrix-text" data-text="WORKOUT">WORKOUT</h1>
        </div> */}

        <div className="text-center mb-12">
          <p className="text-xl text-gray-600 dark:text-gray-400 font-light">
            Manage your templates and log your workouts
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 inline-flex">
            <button
              onClick={() => setActiveTab("templates")}
              className={`min-w-[110px] sm:min-w-[180px] px-4 sm:px-8 py-2.5 sm:py-3.5 font-medium transition-all duration-200 border-0 text-sm sm:text-base ${
                activeTab === "templates"
                  ? "bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Manage Templates
            </button>
            <button
              onClick={() => setActiveTab("workout")}
              className={`min-w-[110px] sm:min-w-[180px] px-4 sm:px-8 py-2.5 sm:py-3.5 font-medium transition-all duration-200 border-0 text-sm sm:text-base ${
                activeTab === "workout"
                  ? "bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Log Workout
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`min-w-[110px] sm:min-w-[180px] px-4 sm:px-8 py-2.5 sm:py-3.5 font-medium transition-all duration-200 border-0 text-sm sm:text-base ${
                activeTab === "data"
                  ? "bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm"
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
    </div>
  )
} 