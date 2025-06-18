"use client"

import { useState } from "react"
import { TemplateManager } from "@/components/workout/template-manager"
import { WorkoutLogger } from "@/components/workout/workout-logger"
import { Button } from "@/components/ui/button"

export default function WorkoutPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "workout">("templates")

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Workout</h1>

      <div className="flex items-center space-x-4 mb-8">
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
        <Button 
          onClick={() => alert('Check In clicked')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
        >
          Check In
        </Button>
      </div>

      {activeTab === "templates" ? (
        <TemplateManager />
      ) : (
        <WorkoutLogger />
      )}
    </div>
  )
} 