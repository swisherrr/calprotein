"use client"

import { useDemo } from "@/components/providers/demo-provider"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { useRouter } from "next/navigation"

export function DemoButton() {
  const { enterDemoMode } = useDemo()
  const router = useRouter()

  const handleDemoClick = () => {
    router.push('/demo')
  }

  return (
    <button onClick={handleDemoClick} className="text-white">
        Try Demo
    </button>
  )
} 