import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { TextHoverEffect } from "@/components/ui/text-hover-effect"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import Link from "next/link"
import { DemoButton } from "@/components/demo-button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-background z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      
      
      <div className="max-w-3xl text-center space-y-8 relative z-30">
        <div className="h-16 md:h-32 flex items-center justify-center">
          <TextHoverEffect text="gainerithm" />
        </div>
        
        <TextGenerateEffect 
          words="The algorithm for gains. Nutrition tracking + progressive overload analysis."
          className="text-gray-600 dark:text-gray-400 font-normal pr-2 pl-2"
        />

        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <HoverBorderGradient
              containerClassName="rounded-full opacity-95 hover:opacity-90"
              className="dark:bg-white bg-black text-white dark:text-black px-8 py-3 font-medium"
            >
              Get Started
            </HoverBorderGradient>
          </Link>
          <Link href="/login">
            <HoverBorderGradient
              containerClassName="rounded-full"
              className="dark:bg-black bg-white text-black dark:text-white px-8 py-3 font-medium"
            >
              Sign In
            </HoverBorderGradient>
          </Link>
        </div>
        <DemoButton />
      </div>
    </div>
  )
}
