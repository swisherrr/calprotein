"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useState } from "react"

export function ExportData() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch all entries for user
      const { data: entries, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      if (!entries) throw new Error('No data found')

      // Header row
      const headers = ['id', 'created_at', 'name', 'calories', 'protein']
      
      // Convert to CSV rows
      const csvRows = [
        headers.join(','),
        ...entries.map(entry => [
          entry.id,
          entry.created_at,
          `"${entry.name}"`,
          entry.calories,
          entry.protein
        ].join(','))
      ].join('\n')

      // Create and trigger download
      const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `entries_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleExport}
      className="flex items-center gap-2"
      disabled={loading}
    >
      <Download className="h-4 w-4" />
      {loading ? 'Exporting...' : 'Export Data'}
    </Button>
  )
} 