"use client"

import { create } from "zustand"

interface ConnectivityState {
  isOnline: boolean
  lastOnlineAt: number | null
  lastOfflineAt: number | null
  pendingMutationCount: number
  setOnline: (isOnline: boolean) => void
  setPendingMutationCount: (count: number) => void
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
  lastOnlineAt: null,
  lastOfflineAt: null,
  pendingMutationCount: 0,
  setOnline: (isOnline) =>
    set({
      isOnline,
      lastOnlineAt: isOnline ? Date.now() : null,
      lastOfflineAt: isOnline ? null : Date.now(),
    }),
  setPendingMutationCount: (pendingMutationCount) => set({ pendingMutationCount }),
}))
