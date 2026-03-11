"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authService, type LoginCredentials, type PinLoginCredentials } from '@/lib/api'
import { getAuthToken, removeAuthToken } from '@/lib/config'
import type { User } from '@/lib/types'

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
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        setUser(null)
        return
      }
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
      removeAuthToken()
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await refreshUser()
      setIsLoading(false)
    }
    initAuth()
  }, [refreshUser])

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const { user: loggedInUser } = await authService.login(credentials)
    setUser(loggedInUser)
    return loggedInUser
  }

  const pinLogin = async (credentials: PinLoginCredentials): Promise<User> => {
    const { user: loggedInUser } = await authService.pinLogin(credentials)
    setUser(loggedInUser)
    return loggedInUser
  }

  const logout = async (): Promise<void> => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
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
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
