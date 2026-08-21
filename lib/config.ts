// API Configuration
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.maharasa.calira.my.id/api',
    timeout: 30000,
  },
  /**
   * Tidak ada `refreshTokenKey` di sini, dan itu disengaja.
   *
   * Backend murni JWT: `/login`, `/login-pin`, dan `/auth/refresh` sama-sama
   * hanya mengembalikan `token` + `expires_in`. Tidak ada refresh token yang
   * bisa disimpan — perpanjangan sesi dilakukan dengan menukar access token
   * yang sudah kedaluwarsa selama masih di dalam `refresh_ttl`, lihat
   * `lib/api/client.ts`.
   */
  auth: {
    tokenKey: 'auth_token',
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
}
