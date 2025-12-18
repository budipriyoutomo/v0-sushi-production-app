import { cn } from "@/lib/utils"

export type Status = "good" | "warning" | "critical"

interface StatusIndicatorProps {
  status: Status
  className?: string
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  good: { label: "Good", color: "bg-emerald-500" },
  warning: { label: "Warning", color: "bg-amber-500" },
  critical: { label: "Critical", color: "bg-red-500" },
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const config = statusConfig[status]

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className={cn("w-2 h-2 rounded-full", config.color)} />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  )
}
