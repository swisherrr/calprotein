"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { useBodyMeasurements, BodyMeasurementInput } from "@/hooks/use-body-measurements"
import { Plus, Calendar, Weight, Ruler, Target, FileText } from "lucide-react"

export function BodyMeasurementsLogger({ onClose }: { onClose?: () => void }) {
  const { measurements, addMeasurement, updateMeasurement, loading } = useBodyMeasurements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BodyMeasurementInput>({
    measurement_date: new Date().toISOString().split('T')[0],
    weight_lbs: undefined,
    bicep_circumference_inches: undefined,
    chest_circumference_inches: undefined,
    waist_circumference_inches: undefined,
    hip_circumference_inches: undefined,
    thigh_circumference_inches: undefined,
    calf_circumference_inches: undefined,
    body_fat_percentage: undefined,
    notes: ''
  })

  const handleInputChange = (field: keyof BodyMeasurementInput, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check if there's already a measurement for this date
      const existingMeasurement = measurements.find(m => m.measurement_date === formData.measurement_date)
      
      if (existingMeasurement) {
        // Update existing measurement
        await updateMeasurement(existingMeasurement.id, formData)
      } else {
        // Add new measurement
        await addMeasurement(formData)
      }
      
      setFormData({
        measurement_date: new Date().toISOString().split('T')[0],
        weight_lbs: undefined,
        bicep_circumference_inches: undefined,
        chest_circumference_inches: undefined,
        waist_circumference_inches: undefined,
        hip_circumference_inches: undefined,
        thigh_circumference_inches: undefined,
        calf_circumference_inches: undefined,
        body_fat_percentage: undefined,
        notes: ''
      })
      // Close the modal if onClose is provided
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error saving body measurement:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getLatestMeasurement = () => {
    return measurements.length > 0 ? measurements[0] : null
  }

  const latestMeasurement = getLatestMeasurement()

  return (
    <div>
      {/* Body Measurements Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Measurement Date
                </label>
                <Input
                  type="date"
                  value={formData.measurement_date}
                  onChange={(e) => handleInputChange('measurement_date', e.target.value)}
                  required
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Weight className="w-4 h-4 mr-2" />
                  Weight (lbs)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 150.5"
                  value={formData.weight_lbs || ''}
                  onChange={(e) => handleInputChange('weight_lbs', parseFloat(e.target.value))}
                />
              </div>

              {/* Body Fat Percentage */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Body Fat Percentage
                </label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 15.5"
                  value={formData.body_fat_percentage || ''}
                  onChange={(e) => handleInputChange('body_fat_percentage', parseFloat(e.target.value))}
                />
              </div>

              {/* Circumference Measurements */}
              <div className="space-y-3">
                <label className="block text-sm font-medium flex items-center">
                  <Ruler className="w-4 h-4 mr-2" />
                  Circumference Measurements (inches)
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Chest</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 42.5"
                      value={formData.chest_circumference_inches || ''}
                      onChange={(e) => handleInputChange('chest_circumference_inches', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Waist</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 32.0"
                      value={formData.waist_circumference_inches || ''}
                      onChange={(e) => handleInputChange('waist_circumference_inches', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bicep</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 14.5"
                      value={formData.bicep_circumference_inches || ''}
                      onChange={(e) => handleInputChange('bicep_circumference_inches', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Hip</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 38.0"
                      value={formData.hip_circumference_inches || ''}
                      onChange={(e) => handleInputChange('hip_circumference_inches', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Thigh</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 22.5"
                      value={formData.thigh_circumference_inches || ''}
                      onChange={(e) => handleInputChange('thigh_circumference_inches', parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Calf</label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 15.0"
                      value={formData.calf_circumference_inches || ''}
                      onChange={(e) => handleInputChange('calf_circumference_inches', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-black text-gray-900 dark:text-gray-100 resize-none"
                  rows={3}
                  placeholder="Optional notes about this measurement..."
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Saving...' : 'Save Measurement'}
                </Button>
              </div>
            </form>

      {/* Latest Measurement Display */}
      {latestMeasurement && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-center">Latest Measurement</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {latestMeasurement.weight_lbs && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
                <p className="text-lg font-semibold">{latestMeasurement.weight_lbs} lbs</p>
              </div>
            )}
            {latestMeasurement.body_fat_percentage && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Body Fat</p>
                <p className="text-lg font-semibold">{latestMeasurement.body_fat_percentage}%</p>
              </div>
            )}
            {latestMeasurement.chest_circumference_inches && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Chest</p>
                <p className="text-lg font-semibold">{latestMeasurement.chest_circumference_inches}"</p>
              </div>
            )}
            {latestMeasurement.waist_circumference_inches && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Waist</p>
                <p className="text-lg font-semibold">{latestMeasurement.waist_circumference_inches}"</p>
              </div>
            )}
            {latestMeasurement.bicep_circumference_inches && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Bicep</p>
                <p className="text-lg font-semibold">{latestMeasurement.bicep_circumference_inches}"</p>
              </div>
            )}
            {latestMeasurement.hip_circumference_inches && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Hip</p>
                <p className="text-lg font-semibold">{latestMeasurement.hip_circumference_inches}"</p>
              </div>
            )}
            {latestMeasurement.thigh_circumference_inches && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Thigh</p>
                <p className="text-lg font-semibold">{latestMeasurement.thigh_circumference_inches}"</p>
              </div>
            )}
            {latestMeasurement.calf_circumference_inches && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Calf</p>
                <p className="text-lg font-semibold">{latestMeasurement.calf_circumference_inches}"</p>
              </div>
            )}
          </div>
          <div className="text-center mt-4 text-sm text-gray-500">
            {new Date(latestMeasurement.measurement_date).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* No Data State */}
      {measurements.length === 0 && !loading && (
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            No measurements logged yet. Fill out the form above to get started.
          </p>
        </div>
      )}
    </div>
  )
}
