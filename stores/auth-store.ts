"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/lib/types"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthState {
  user: User | null
  status: AuthStatus
  lastRestoredAt: number | null
  setSession: (user: User | null, status: AuthStatus) => void
  setStatus: (status: AuthStatus) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: "loading",
      lastRestoredAt: null,
      setSession: (user, status) => set({ user, status, lastRestoredAt: Date.now() }),
      setStatus: (status) => set({ status }),
      clearSession: () => set({ user: null, status: "unauthenticated", lastRestoredAt: null }),
    }),
    {
      name: "maharasa-auth-session",
      partialize: (state) => ({
        user: state.user,
        status: state.status === "authenticated" ? state.status : "unauthenticated",
        lastRestoredAt: state.lastRestoredAt,
      }),
    }
  )
)
