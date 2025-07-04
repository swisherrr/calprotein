import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "font-medium transition-colors inline-flex items-center justify-center",
          variant === 'default' && "bg-foreground text-background hover:opacity-90",
          variant === 'outline' && "border border-foreground hover:bg-foreground hover:text-background",
          variant === 'ghost' && "hover:bg-gray-100 dark:hover:bg-gray-800",
          size === 'default' && "h-10 px-4 py-2",
          size === 'sm' && "h-8 px-3 text-sm",
          size === 'lg' && "h-12 px-8",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button } 