"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type UsualItem = {
  id: number
  name: string
  portion: string
  calories: number
  protein: number
  isChecked: boolean
}

export function UsualsSection({
  onAdd
}: {
  onAdd: (calories: number, protein: number) => void
}) {
  const [usuals] = useState<UsualItem[]>([
    { id: 1, name: "Greek Yogurt", portion: "25g", calories: 150, protein: 12, isChecked: false },
    { id: 2, name: "Protein Shake", portion: "30g", calories: 120, protein: 24, isChecked: false },
    // Add more usual items here
  ])

  const [selectedItems, setSelectedItems] = useState<UsualItem[]>([])

  const handleCheckboxChange = (item: UsualItem) => {
    const updatedItems = usuals.map((usual) =>
      usual.id === item.id ? { ...usual, isChecked: !usual.isChecked } : usual
    )
    setSelectedItems(updatedItems.filter(item => item.isChecked))
  }

  const handleAddSelected = () => {
    const totalCalories = selectedItems.reduce((sum, item) => sum + item.calories, 0)
    const totalProtein = selectedItems.reduce((sum, item) => sum + item.protein, 0)
    onAdd(totalCalories, totalProtein)
    // Reset checkboxes
    setSelectedItems([])
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="font-semibold mb-4">The Usuals</h2>
      <div className="space-y-2">
        {usuals.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.isChecked}
                onChange={() => handleCheckboxChange(item)}
                className="rounded"
              />
              <span>{item.name}</span>
              <span className="text-sm text-gray-500">({item.portion})</span>
            </div>
            <div className="text-sm text-gray-600">
              {item.calories}cal • {item.protein}g protein
            </div>
          </div>
        ))}
      </div>
      {selectedItems.length > 0 && (
        <Button 
          onClick={handleAddSelected}
          className="mt-4"
        >
          Add Selected ({selectedItems.length})
        </Button>
      )}
    </div>
  )
} 