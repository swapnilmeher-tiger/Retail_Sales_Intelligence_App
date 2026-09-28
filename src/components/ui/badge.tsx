import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "danger" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "border-transparent bg-blue-500/20 text-blue-300 border-blue-500/30": variant === "default",
          "border-slate-700 bg-slate-800 text-slate-300": variant === "secondary",
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-400": variant === "success",
          "border-amber-500/30 bg-amber-500/15 text-amber-400": variant === "warning",
          "border-rose-500/30 bg-rose-500/15 text-rose-400": variant === "danger",
          "border-slate-700 text-slate-300": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
