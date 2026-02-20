'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { outlets } from './mock-data'

interface OutletContextType {
  selectedOutletId: string
  setSelectedOutletId: (id: string) => void
  outlets: typeof outlets
}

const OutletContext = createContext<OutletContextType | undefined>(undefined)

export function OutletProvider({ children }: { children: ReactNode }) {
  const [selectedOutletId, setSelectedOutletId] = useState(outlets[0]?.id || '')

  return (
    <OutletContext.Provider value={{ selectedOutletId, setSelectedOutletId, outlets }}>
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
