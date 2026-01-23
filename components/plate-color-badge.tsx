import { cn } from "@/lib/utils"

export type PlateColor = "white" | "blue" | "pink" | "black" | "red" | "gold" | "choco motive" | "yellow" | "silver"

interface PlateColorBadgeProps {
  color: PlateColor
  className?: string
}

const colorStyles: Record<PlateColor, string> = {
  white: "bg-gray-100 text-gray-900 border border-gray-300",
  blue: "bg-blue-500 text-white",
  pink: "bg-pink-500 text-white",
  black: "bg-zinc-900 text-white",
  red: "bg-red-500 text-white",
  gold: "bg-yellow-500 text-gray-900",
  "choco motive": "bg-amber-900 text-white",
  yellow: "bg-yellow-400 text-gray-900",
  silver: "bg-gray-400 text-white",
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
