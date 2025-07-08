import { HistoryChart } from "@/components/profile/history-chart"
import { StatsSection } from "@/components/profile/stats-section"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ExportData } from "@/components/profile/export-data"

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
        <ExportData />
      </div>
      <div className="space-y-8">
        <StatsSection />
        <HistoryChart />
      </div>
    </div>
  )
} 