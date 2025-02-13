import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { Boxes } from "@/components/ui/background-boxes"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-background z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      
      <Boxes />
      
      <div className="max-w-3xl text-center space-y-8 relative z-30">
        <h1 className="text-6xl font-bold">
          Just The Numbers You Need
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400">
          A minimalistic approach to tracking your calories and protein.
        </p>

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
      </div>
    </div>
  )
}
