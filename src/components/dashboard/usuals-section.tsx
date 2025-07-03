"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useUsuals } from "@/hooks/use-usuals"
import { Plus, X } from "lucide-react"

export function UsualsSection({
  onAdd
}: {
  onAdd: (calories: number, protein: number, name: string) => void
}) {
  const { usuals, loading, addUsual, deleteUsual } = useUsuals()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [newUsual, setNewUsual] = useState({
    name: "",
    portion: "",
    calories: "",
    protein: ""
  })

  const handleCheckboxChange = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleAddSelected = async () => {
    const selectedUsuals = usuals.filter(usual => selectedItems.includes(usual.id))
    const totalCalories = selectedUsuals.reduce((sum, item) => sum + item.calories, 0)
    const totalProtein = selectedUsuals.reduce((sum, item) => sum + item.protein, 0)
    
    try {
      // Create name from selected items
      const name = selectedUsuals.length === 1 
        ? selectedUsuals[0].name 
        : `${selectedUsuals.map(item => item.name).join(", ")}`

      await onAdd(totalCalories, totalProtein, name)
      setSelectedItems([])
    } catch (error) {
      console.error('Failed to add selected items:', error)
    }
  }

  const handleAddNewUsual = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addUsual({
        name: newUsual.name,
        portion: newUsual.portion,
        calories: parseInt(newUsual.calories),
        protein: parseInt(newUsual.protein)
      })
      setNewUsual({ name: "", portion: "", calories: "", protein: "" })
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add usual:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-6 bg-gray-800/50 inset-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">The Usuals</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span>Add New</span>
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddNewUsual} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Name"
              value={newUsual.name}
              onChange={e => setNewUsual(prev => ({ ...prev, name: e.target.value }))}
              className="rounded-md border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
              required
            />
            <input
              placeholder="Portion (e.g., 100g)"
              value={newUsual.portion}
              onChange={e => setNewUsual(prev => ({ ...prev, portion: e.target.value }))}
              className="rounded-md border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
              required
            />
            <input
              placeholder="Calories"
              type="number"
              value={newUsual.calories}
              onChange={e => setNewUsual(prev => ({ ...prev, calories: e.target.value }))}
              className="rounded-md border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
              required
            />
            <input
              placeholder="Protein (g)"
              type="number"
              value={newUsual.protein}
              onChange={e => setNewUsual(prev => ({ ...prev, protein: e.target.value }))}
              className="rounded-md border px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-700"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Usual
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {usuals.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => handleCheckboxChange(item.id)}
                className="rounded"
              />
              <span>{item.name}</span>
              <span className="text-sm text-gray-500">({item.portion})</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {item.calories}cal • {item.protein}g protein
              </div>
              <button
                onClick={() => deleteUsual(item.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
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