'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Outlet } from './types'
import { useActiveOutlets } from '@/hooks/use-outlets'

interface OutletContextType {
  selectedOutletId: string
  setSelectedOutletId: (id: string) => void
  outlets: Outlet[]
  isLoading: boolean
}

const OutletContext = createContext<OutletContextType | undefined>(undefined)

export function OutletProvider({ children }: { children: ReactNode }) {
  const { outlets, isLoading } = useActiveOutlets()
  const [selectedOutletId, setSelectedOutletId] = useState<string>('')

  // Automatically select the first outlet if none is selected
  useEffect(() => {
    if (outlets.length > 0 && !selectedOutletId) {
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
