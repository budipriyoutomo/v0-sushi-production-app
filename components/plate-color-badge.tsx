import { cn } from "@/lib/utils"

export type PlateColor = "green" | "blue" | "red" | "black"

interface PlateColorBadgeProps {
  color: PlateColor
  className?: string
}

const colorStyles: Record<PlateColor, string> = {
  green: "bg-emerald-500 text-white",
  blue: "bg-blue-500 text-white",
  red: "bg-red-500 text-white",
  black: "bg-zinc-900 text-white",
}

export function PlateColorBadge({ color, className }: PlateColorBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colorStyles[color],
        className,
      )}
    >
      {color.charAt(0).toUpperCase() + color.slice(1)}
    </span>
  )
}
