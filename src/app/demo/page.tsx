"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDemo } from '@/components/providers/demo-provider'

export default function DemoPage() {
  const router = useRouter()
  const { enterDemoMode } = useDemo()

  useEffect(() => {
    // Set cookie immediately for middleware
    if (typeof window !== 'undefined') {
      document.cookie = 'demo-mode=true; path=/; max-age=86400; samesite=lax'
    }
    enterDemoMode()
    router.push('/dashboard')
  }, [enterDemoMode, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Entering demo mode...</p>
      </div>
    </div>
  )
} 