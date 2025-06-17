"use client"

import { useState } from "react"
import { TemplateManager } from "@/components/workout/template-manager"
import { WorkoutLogger } from "@/components/workout/workout-logger"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface CheckIn {
  weight?: number
  bodyFatPercentage?: number
  chestMeasurement?: number
  waistMeasurement?: number
  hipMeasurement?: number
  armMeasurement?: number
  thighMeasurement?: number
  notes?: string
}

export default function WorkoutPage() {
  const [activeTab, setActiveTab] = useState<"templates" | "workout">("templates")
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [checkInData, setCheckInData] = useState<CheckIn>({})
  const [isSaving, setIsSaving] = useState(false)

  const handleCheckInChange = (field: keyof CheckIn, value: string | number) => {
    setCheckInData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCheckInSubmit = async () => {
    try {
      setIsSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in to save check-ins")
        return
      }

      // Convert camelCase to snake_case for database
      const dbData = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        weight: checkInData.weight,
        body_fat_percentage: checkInData.bodyFatPercentage,
        chest_measurement: checkInData.chestMeasurement,
        waist_measurement: checkInData.waistMeasurement,
        hip_measurement: checkInData.hipMeasurement,
        arm_measurement: checkInData.armMeasurement,
        thigh_measurement: checkInData.thighMeasurement,
        notes: checkInData.notes
      }

      console.log('Attempting to save check-in with data:', dbData)

      const { data, error } = await supabase
        .from('check_ins')
        .insert([dbData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Check-in saved successfully:', data)
      toast.success("Check-in saved successfully!")
      setIsCheckInOpen(false)
      setCheckInData({})
    } catch (error) {
      console.error('Error saving check-in:', error)
      toast.error(error instanceof Error ? error.message : "Failed to save check-in. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Workout</h1>

      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant={activeTab === "templates" ? "default" : "outline"}
          onClick={() => setActiveTab("templates")}
        >
          Manage Templates
        </Button>
        <Button
          variant={activeTab === "workout" ? "default" : "outline"}
          onClick={() => setActiveTab("workout")}
        >
          Log Workout
        </Button>
        <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Check In</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Body Check-In</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Weight (lbs)</label>
                <input
                  type="number"
                  value={checkInData.weight || ''}
                  onChange={(e) => handleCheckInChange('weight', parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Body Fat %</label>
                <input
                  type="number"
                  value={checkInData.bodyFatPercentage || ''}
                  onChange={(e) => handleCheckInChange('bodyFatPercentage', parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chest (inches)</label>
                <input
                  type="number"
                  value={checkInData.chestMeasurement || ''}
                  onChange={(e) => handleCheckInChange('chestMeasurement', parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Waist (inches)</label>
                <input
                  type="number"
                  value={checkInData.waistMeasurement || ''}
                  onChange={(e) => handleCheckInChange('waistMeasurement', parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hips (inches)</label>
                <input
                  type="number"
                  value={checkInData.hipMeasurement || ''}
                  onChange={(e) => handleCheckInChange('hipMeasurement', parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Arms (inches)</label>
                <input
                  type="number"
                  value={checkInData.armMeasurement || ''}
                  onChange={(e) => handleCheckInChange('armMeasurement', parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Thighs (inches)</label>
                <input
                  type="number"
                  value={checkInData.thighMeasurement || ''}
                  onChange={(e) => handleCheckInChange('thighMeasurement', parseFloat(e.target.value))}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={checkInData.notes || ''}
                  onChange={(e) => handleCheckInChange('notes', e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCheckInOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCheckInSubmit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Check-In"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeTab === "templates" ? (
        <TemplateManager />
      ) : (
        <WorkoutLogger />
      )}
    </div>
  )
} 