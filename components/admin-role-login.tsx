'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle } from 'lucide-react'

const ADMIN_ROLES = {
  administrator: {
    username: 'admin',
    password: 'admin',
    title: 'Administrator',
    description: 'All Pages',
    pages: ['admin', 'production', 'operation', 'kitchen'],
    dashboardRoute: '/admin/plate-colors',
  },
  production: {
    username: 'production',
    password: 'production',
    title: 'Production',
    description: 'Production Planning, Waste Management',
    pages: ['production'],
    dashboardRoute: '/production/planning',
  },
  operation: {
    username: 'operation',
    password: 'operation',
    title: 'Operation',
    description: 'Sales Input, Closing Report',
    pages: ['operation'],
    dashboardRoute: '/operation/sales-input',
  },
}

type RoleKey = keyof typeof ADMIN_ROLES

export function AdminRoleLogin() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRole, setSelectedRole] = useState<RoleKey>('administrator')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const role = ADMIN_ROLES[selectedRole]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (username === role.username && password === role.password) {
      toast({
        title: 'Login Successful',
        description: `Welcome, ${role.title}!`,
      })
      router.push(role.dashboardRoute)
    } else {
      toast({
        title: 'Login Failed',
        description: `Invalid username or password for ${role.title} role.`,
        variant: 'destructive',
      })
      setPassword('')
    }

    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-primary-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53 0L12 2.845l.265.265Zm-3 0a.375.375 0 1 1-.53 0L9 2.845l.265.265Zm6 0a.375.375 0 1 1-.53 0L15 2.845l.265.265Z"
              />
            </svg>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
        <CardDescription>Select your role and enter credentials</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Role</Label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.entries(ADMIN_ROLES) as [RoleKey, typeof ADMIN_ROLES[RoleKey]][]).map(
              ([key, roleInfo]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRole(key)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedRole === key
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-sm">{roleInfo.title}</div>
                  <div className="text-xs text-muted-foreground">{roleInfo.description}</div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Login Hint */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-semibold mb-1">Demo Credentials:</p>
              <p>Username: <span className="font-mono">{role.username}</span></p>
              <p>Password: <span className="font-mono">{role.password}</span></p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
