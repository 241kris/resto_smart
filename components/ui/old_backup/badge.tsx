import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
    secondary: "border-transparent bg-emerald-700 text-white",
    destructive: "border-transparent bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]",
    outline: "text-[hsl(var(--foreground))]",
    success: "border-transparent bg-green-500 text-white",
    warning: "border-transparent bg-yellow-500 text-white",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
