import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button>Add Entry</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold mb-2">Today's Calories</h2>
          <p className="text-3xl font-bold">0 / 2000</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold mb-2">Protein</h2>
          <p className="text-3xl font-bold">0g / 150g</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="font-semibold mb-2">Recent Entries</h2>
          <p className="text-gray-500">No entries yet</p>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Today's Log</h2>
        <p className="text-gray-500">No meals logged today</p>
      </div>
    </div>
  )
} 