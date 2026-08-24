"use client"

import { cn } from "@/lib/utils"
import { useNow } from "@/hooks/use-now"

interface ExpirationCountdownProps {
  productionTime: Date
  shelfLifeMinutes: number
  className?: string
}

export function ExpirationCountdown({ productionTime, shelfLifeMinutes, className }: ExpirationCountdownProps) {
  // Jam datang dari satu ticker bersama, bukan `setInterval` per kartu — lihat
  // hooks/use-now.ts. Sisa waktu dihitung saat render, tanpa state lokal, jadi
  // `productionTime` yang dibuat ulang tiap render induk tidak lagi
  // membongkar-pasang timer.
  const now = useNow()

  const totalTime = shelfLifeMinutes * 60 * 1000
  const expiration = productionTime.getTime() + totalTime

  // Sebelum mount `now` masih null. Tampilkan 0:00 dengan bar penuh — persis
  // state awal versi lama — supaya render server dan render pertama klien sama
  // dan tidak ada kedipan merah sekejap sebelum detak pertama.
  const timeRemaining = now === null ? 0 : Math.max(0, expiration - now)
  const percentage =
    now === null ? 100 : totalTime > 0 ? Math.max(0, (timeRemaining / totalTime) * 100) : 0

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
