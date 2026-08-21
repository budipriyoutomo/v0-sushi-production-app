"use client"

import { createContext, useContext, useEffect, useCallback, type ReactNode } from "react"
import { authService, type LoginCredentials, type PinLoginCredentials } from "@/lib/api"
import { getAuthToken, removeAuthToken } from "@/lib/config"
import { isAuthInvalidError, isTransientApiError } from "@/services/api-errors"
import { logOperationalError } from "@/services/error-logger"
import { useAuthStore } from "@/stores/auth-store"
import { useOutletStore } from "@/stores/outlet-store"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  pinLogin: (credentials: PinLoginCredentials) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const setSession = useAuthStore((state) => state.setSession)
  const setStatus = useAuthStore((state) => state.setStatus)
  const clearSession = useAuthStore((state) => state.clearSession)

  const refreshUser = useCallback(async () => {
    const restoredUser = useAuthStore.getState().user

    try {
      const token = getAuthToken()

      if (!token) {
        clearSession()
        return
      }

      try {
        const currentUser = await authService.getCurrentUser()
        setSession(currentUser, "authenticated")
      } catch (apiError: unknown) {
        if (isAuthInvalidError(apiError)) {
          clearSession()
          removeAuthToken()
          return
        }

        if (isTransientApiError(apiError)) {
          logOperationalError({
            level: "warning",
            message: "Auth restoration deferred because API is unavailable",
            error: apiError,
          })
          setStatus(restoredUser ? "authenticated" : "loading")
          return
        }

        logOperationalError({
          level: "error",
          message: "Auth API error",
          error: apiError,
        })
        setStatus(restoredUser ? "authenticated" : "unauthenticated")
      }
    } catch (error) {
      logOperationalError({
        level: "error",
        message: "Auth restoration failed",
        error,
      })
      setStatus(restoredUser ? "authenticated" : "unauthenticated")
    }
  }, [clearSession, setSession, setStatus])

  useEffect(() => {
    setStatus(useAuthStore.getState().user ? "authenticated" : "loading")
    void refreshUser()
  }, [refreshUser, setStatus])

  /**
   * Outlet yang terpilih milik orang yang memilihnya, bukan milik tabletnya.
   *
   * `selectedOutletId` persist di localStorage dan tidak ikut dibersihkan
   * `clearSession()`. Di tablet dapur yang dipakai bergantian, pengguna
   * berikutnya mewarisi pilihan pengguna sebelumnya. `OutletProvider` menolak
   * outlet yang bukan milik user ini, tapi kalau keduanya sama-sama memegang
   * outlet itu tidak ada yang janggal untuk ditolak — dan orang berikutnya
   * diam-diam bekerja di outlet yang salah.
   *
   * Direset saat login, bukan saat logout: hanya login yang pasti dilewati
   * setiap sesi baru. Tab yang ditutup tanpa logout, atau sesi yang diakhiri
   * `endSession()` dari interceptor, tidak pernah melewati jalur logout.
   */
  const startFreshOutletSelection = () => {
    useOutletStore.getState().setSelectedOutletId("")
  }

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const { user: loggedInUser } = await authService.login(credentials)
    startFreshOutletSelection()
    setSession(loggedInUser, "authenticated")
    return loggedInUser
  }

  const pinLogin = async (credentials: PinLoginCredentials): Promise<User> => {
    const { user: loggedInUser } = await authService.pinLogin(credentials)
    startFreshOutletSelection()
    setSession(loggedInUser, "authenticated")
    return loggedInUser
  }

  const logout = async (): Promise<void> => {
    try {
      await authService.logout()
    } catch (error) {
      logOperationalError({
        level: "warning",
        message: "Logout API error ignored",
        error,
      })
    } finally {
      clearSession()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
        login,
        pinLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
