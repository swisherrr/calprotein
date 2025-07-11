"use client"

import { useDemo } from "@/components/providers/demo-provider"
import { useRouter } from "next/navigation"

export function DemoButton() {
  const { enterDemoMode } = useDemo()
  const router = useRouter()

  const handleDemoClick = () => {
    router.push('/demo')
  }

  return (
    <button onClick={handleDemoClick} className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Try Demo
    </button>
  )
} 