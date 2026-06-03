"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface OutletState {
  selectedOutletId: string
  setSelectedOutletId: (id: string) => void
}

export const useOutletStore = create<OutletState>()(
  persist(
    (set) => ({
      selectedOutletId: "",
      setSelectedOutletId: (selectedOutletId) => set({ selectedOutletId }),
    }),
    {
      name: "maharasa-active-outlet",
    }
  )
)
