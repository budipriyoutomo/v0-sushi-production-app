'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getApiError } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

// Get first available route based on user's module_app
function getFirstAvailableRoute(moduleApp: string[]): string {
  // Priority order for routing
  const moduleRoutes: Record<string, string> = {
    'admin': '/admin/plate-colors',
    'production': '/production/planning',
    'operation': '/operation/sales-input',
    'report': '/report/production-item-list',
    'kitchen': '/kitchen/dashboard',
    'service': '/operation/sales-input',
  }

  // Find first available module (excluding 'app')
  for (const mod of moduleApp) {
    if (mod !== 'app' && moduleRoutes[mod]) {
      return moduleRoutes[mod]
    }
  }

  // Default fallback
  return '/admin/plate-colors'
}

export function AdminRoleLogin() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Use auth context login so the navbar/layout state updates immediately
      const user = await login({ email: username, password })
      toast({
        title: 'Login Successful',
        description: `Welcome, ${user.name}!`,
      })
      // Redirect based on user's module_app access
      const route = getFirstAvailableRoute(user.module_app || [])
      router.push(route)
    } catch (error) {
      const apiError = getApiError(error)
      toast({
        title: 'Login Failed',
        description: apiError.message || 'Invalid username or password',
        variant: 'destructive',
      })
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm border-stone-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl">
      <CardHeader className="space-y-4 text-center pt-8 pb-4">
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <Image
              src="/Maharasa Logo_FA-01.png"
              alt="Maharasa Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold tracking-tight text-stone-850">Admin Login</CardTitle>
          <CardDescription className="text-xs text-stone-400">Enter your credentials to access the system</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-8">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-medium text-stone-600">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
              className="h-10 rounded-xl border-stone-200 bg-stone-50/30 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all placeholder:text-stone-400 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-stone-600">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="h-10 rounded-xl border-stone-200 bg-stone-50/30 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all placeholder:text-stone-400 text-sm pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400 hover:text-emerald-600 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full h-10 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl shadow-sm transition-all duration-200 mt-2" 
            size="lg" 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}