"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ExpirationCountdownProps {
  productionTime: Date
  shelfLifeMinutes: number
  className?: string
}

export function ExpirationCountdown({ productionTime, shelfLifeMinutes, className }: ExpirationCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [percentage, setPercentage] = useState(100)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const production = productionTime.getTime()
      const expiration = production + shelfLifeMinutes * 60 * 1000
      const remaining = Math.max(0, expiration - now)
      const totalTime = shelfLifeMinutes * 60 * 1000

      setTimeRemaining(remaining)
      setPercentage(Math.max(0, (remaining / totalTime) * 100))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [productionTime, shelfLifeMinutes])

  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)

  const getStatus = () => {
    if (percentage > 50) return "good"
    if (percentage > 20) return "warning"
    return "critical"
  }

  const status = getStatus()

  return (
    <div className={cn("space-y-2", className)}>
  
      {/* GLASS WRAPPER */}
      <div className="
        bg-white/15 
        backdrop-blur-md 
        border border-white/30 
        rounded-lg 
        p-1
        shadow-sm
      ">
        
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-white">
            Time Remaining
          </span>

          <span
            className={cn(
              "font-mono font-bold text-sm",
              {
                "text-emerald-400": status === "good",
                "text-amber-500": status === "warning",
                "text-red-600": status === "critical",
              }
            )}
          >
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>

        {/* Custom Progress Bar */}
        <div className="mt-2 h-2 w-full bg-white/30 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-500", {
              "bg-emerald-400": status === "good",
              "bg-amber-400": status === "warning",
              "bg-red-500": status === "critical",
            })}
            style={{ width: `${percentage}%` }}
          />
        </div>

      </div>
    </div>
  )
}
