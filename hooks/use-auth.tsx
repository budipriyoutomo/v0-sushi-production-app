"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authService, type LoginCredentials, type PinLoginCredentials } from '@/lib/api'
import { getAuthToken, removeAuthToken } from '@/lib/config'
import type { User } from '@/lib/types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

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
  const [status, setStatus] = useState<AuthStatus>('loading')

  const refreshUser = useCallback(async () => {
    try {
      const token = getAuthToken()

      if (!token) {
        setUser(null)
        setStatus('unauthenticated')
        return
      }

      // Try to get current user from API
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
        setStatus('authenticated')
      } catch (apiError: unknown) {
        // If 404 or 401, user is not authenticated
        const error = apiError as { response?: { status?: number } }
        if (error?.response?.status === 404 || error?.response?.status === 401) {
          setUser(null)
          setStatus('unauthenticated')
          removeAuthToken()
        } else {
          // For other errors, still mark as unauthenticated but log the error
          console.error('Auth API error:', apiError)
          setUser(null)
          setStatus('unauthenticated')
          removeAuthToken()
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setUser(null)
      setStatus('unauthenticated')
      removeAuthToken()
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      setStatus('loading')
      await refreshUser()
    }
    initAuth()
  }, [refreshUser])

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const { user: loggedInUser } = await authService.login(credentials)
    setUser(loggedInUser)
    setStatus('authenticated')
    return loggedInUser
  }

  const pinLogin = async (credentials: PinLoginCredentials): Promise<User> => {
    const { user: loggedInUser } = await authService.pinLogin(credentials)
    setUser(loggedInUser)
    setStatus('authenticated')
    return loggedInUser
  }

  const logout = async (): Promise<void> => {
    await authService.logout()
    setUser(null)
    setStatus('unauthenticated')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
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
