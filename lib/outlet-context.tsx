'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react'
import type { Outlet } from './types'
import { useActiveOutlets } from '@/hooks/use-outlets' 
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

interface OutletContextType {
  selectedOutletId: string
  setSelectedOutletId: (id: string) => void
  outlets: Outlet[]
  isLoading: boolean
}

const OutletContext = createContext<OutletContextType | undefined>(undefined)

export function OutletProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const shouldFetch = pathname !== '/login'

  const { outlets: allOutlets, isLoading } = useActiveOutlets(shouldFetch ? undefined : null)
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')

  // Filter outlets based on user's allowed outlet codes
  // Admin role bypasses filter and gets all outlets
  const outlets = useMemo(() => {
    if (!user || !user.outlet || user.role === 'admin') {
      return allOutlets
    }

    const allowedOutletCodes = new Set(
      user.outlet.map((code) => code.trim().toLowerCase())
    )

    // Filter outlets by matching normalized outlet codes.
    return allOutlets.filter((outlet) =>
      allowedOutletCodes.has(outlet.code.trim().toLowerCase())
    )
  }, [allOutlets, user])

  // Automatically select the first outlet if none is selected
  useEffect(() => {
    if (!selectedOutletId && outlets.length > 0) {
      setSelectedOutletId(outlets[0].id)
    }
    // Reset selection if current selection is not in filtered outlets
    if (selectedOutletId && outlets.length > 0 && !outlets.find(o => o.id === selectedOutletId)) {
      setSelectedOutletId(outlets[0].id)
    }
  }, [outlets, selectedOutletId])

  return (
    <OutletContext.Provider value={{ selectedOutletId, setSelectedOutletId, outlets, isLoading }}>
      {children}
    </OutletContext.Provider>
  )
}

export function useOutlet() {
  const context = useContext(OutletContext)
  if (context === undefined) {
    throw new Error('useOutlet must be used within OutletProvider')
  }
  return context
}
