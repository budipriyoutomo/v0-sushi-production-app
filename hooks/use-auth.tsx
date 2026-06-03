"use client"

import { createContext, useContext, useEffect, useCallback, type ReactNode } from "react"
import { authService, type LoginCredentials, type PinLoginCredentials } from "@/lib/api"
import { getAuthToken, removeAuthToken } from "@/lib/config"
import { isAuthInvalidError, isTransientApiError } from "@/services/api-errors"
import { logOperationalError } from "@/services/error-logger"
import { useAuthStore } from "@/stores/auth-store"
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

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const { user: loggedInUser } = await authService.login(credentials)
    setSession(loggedInUser, "authenticated")
    return loggedInUser
  }

  const pinLogin = async (credentials: PinLoginCredentials): Promise<User> => {
    const { user: loggedInUser } = await authService.pinLogin(credentials)
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
