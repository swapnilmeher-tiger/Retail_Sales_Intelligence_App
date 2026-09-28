import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "accent"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          {
            "bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/25 active:scale-[0.98]": variant === "default",
            "bg-slate-800 text-slate-100 hover:bg-slate-700/90 border border-slate-700/60 active:scale-[0.98]": variant === "secondary",
            "border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white active:scale-[0.98]": variant === "outline",
            "hover:bg-slate-800 text-slate-300 hover:text-white": variant === "ghost",
            "bg-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-500/25": variant === "destructive",
            "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-500/25 active:scale-[0.98]": variant === "accent",
            "h-9 px-4 py-2 text-sm": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-11 rounded-lg px-6 text-base font-semibold": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
