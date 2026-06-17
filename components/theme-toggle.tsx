'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  collapsed?: boolean
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch: theme is only known on the client.
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  return (
    <Button
      variant="ghost"
      title={collapsed ? (isDark ? 'Light mode' : 'Dark mode') : undefined}
      onClick={toggleTheme}
      className={`w-full h-9 px-3 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-transparent hover:border-emerald-500/20 transition-all duration-200 flex items-center ${
        collapsed ? 'justify-center' : 'justify-between'
      }`}
    >
      <span className="flex items-center gap-2">
        {mounted && isDark ? (
          <Sun className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Moon className="w-3.5 h-3.5 shrink-0" />
        )}
        {!collapsed && <span>{mounted && isDark ? 'Light Mode' : 'Dark Mode'}</span>}
      </span>
    </Button>
  )
}
