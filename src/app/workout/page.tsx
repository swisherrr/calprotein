"use client"

import { useState } from "react"
import { TemplateManager } from "@/components/workout/template-manager"
import { WorkoutLogger } from "@/components/workout/workout-logger"

export default function WorkoutPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "workout">("templates")

  return (
    <div className="container mx-auto py-8">
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-md ${
            activeTab === "templates"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Manage Templates
        </button>
        <button
          onClick={() => setActiveTab("workout")}
          className={`px-4 py-2 rounded-md ${
            activeTab === "workout"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Log Workout
        </button>
      </div>

      {activeTab === "templates" ? (
        <TemplateManager />
      ) : (
        <WorkoutLogger />
      )}
    </div>
  )
} 