"use client"

import { create } from "zustand"

interface OperationalUiState {
  lastQueueDrainAt: number | null
  isRetryingQueue: boolean
  setQueueRetrying: (isRetryingQueue: boolean) => void
  markQueueDrained: () => void
}

export const useOperationalUiStore = create<OperationalUiState>((set) => ({
  lastQueueDrainAt: null,
  isRetryingQueue: false,
  setQueueRetrying: (isRetryingQueue) => set({ isRetryingQueue }),
  markQueueDrained: () => set({ lastQueueDrainAt: Date.now(), isRetryingQueue: false }),
}))
