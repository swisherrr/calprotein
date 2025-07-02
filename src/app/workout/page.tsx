"use client"

import { useState } from "react"
import { TemplateManager } from "@/components/workout/template-manager"
import { WorkoutLogger } from "@/components/workout/workout-logger"

export default function WorkoutPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "workout">("templates")

  return (
    <div className="container-apple section-apple">
      <div className="animate-fade-in-up">
        <div className="text-center mb-12">
          <h1 className="mb-4">Workout</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-light">
            Manage your templates and log your workouts
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 inline-flex">
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-200 ${
                activeTab === "templates"
                  ? "bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Manage Templates
            </button>
            <button
              onClick={() => setActiveTab("workout")}
              className={`px-8 py-3 rounded-full font-medium transition-all duration-200 ${
                activeTab === "workout"
                  ? "bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              Log Workout
            </button>
          </div>
        </div>

        {activeTab === "templates" ? (
          <TemplateManager />
        ) : (
          <WorkoutLogger />
        )}
      </div>
    </div>
  )
} 