// API Configuration
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.maharasa.calira.my.id',
    timeout: 30000,
  },
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
  },
}

// Get auth token from storage (client-side only)
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(config.auth.tokenKey)
}

// Set auth token in storage
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(config.auth.tokenKey, token)
}

// Remove auth token from storage
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(config.auth.tokenKey)
  localStorage.removeItem(config.auth.refreshTokenKey)
}
