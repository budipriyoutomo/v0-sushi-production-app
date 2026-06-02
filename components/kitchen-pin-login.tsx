"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getApiError } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, X } from "lucide-react"
import type { User } from "@/lib/types"

function canAccessKitchen(user: User | null) {
  if (!user) return false

  const role = user.role.toLowerCase()
  const hasKitchenRole = ["admin", "kitchen", "service"].includes(role)
  const hasKitchenModule = !user.module_app || user.module_app.includes("kitchen")

  return hasKitchenRole && hasKitchenModule
}

export function KitchenPinLogin() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: isAuthLoading, pinLogin, logout } = useAuth()
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Redirect jika session user terdeteksi sudah login
  useEffect(() => {
    if (isAuthLoading) return

    if (isAuthenticated && canAccessKitchen(user)) {
      router.replace("/kitchen/dashboard")
    }
  }, [isAuthLoading, isAuthenticated, user, router])

  const handleNumberClick = (num: string) => {
    if (pin.length < 6 && !isLoading) {
      setPin((prev) => prev + num)
      setError("")
    }
  }

  const handleClear = () => {
    if (isLoading) return
    setPin("")
    setError("")
  }

  const handleDelete = () => {
    if (isLoading) return
    setPin((prev) => prev.slice(0, -1))
    setError("")
  }

  const handleClose = async () => {
    try { 
      await logout()
    } catch (err) {
      console.error(err)
    } finally { 
      if (window.opener) {
        window.close()
        return
      } 
      if (window.history.length > 1) { 
        window.history.back() 
      } else {
        // Jika tidak ada riwayat, alihkan paksa ke root domain atau login portal utama
        window.location.href = "/login/kitchen" 
      }
    }
  }

  // Bungkus dengan useCallback agar aman dieksekusi di dalam useEffect auto-submit
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (pin.length !== 6 || isLoading) return

    setIsLoading(true)
    setError("")

    try {
      const loggedInUser = await pinLogin({ pin })

      if (!canAccessKitchen(loggedInUser)) {
        await logout()
        setError("User does not have kitchen access.")
        setPin("")
        return
      }

      router.replace("/kitchen/dashboard")
    } catch (err) {
      const apiError = getApiError(err)
      setError(apiError.message || "Invalid PIN. Please try again.")
      setPin("")
    } finally {
      setIsLoading(false)
    }
  }, [pin, isLoading, pinLogin, logout, router])

  // Auto-Submit instan begitu digit ke-6 dimasukkan
  useEffect(() => {
    if (pin.length === 6) {
      handleSubmit()
    }
  }, [pin, handleSubmit])

  if (isAuthLoading || (isAuthenticated && canAccessKitchen(user))) {
    return (
      <Card className="w-full max-w-sm mx-4">
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative w-full max-w-sm border-0 sm:border select-none shadow-none sm:shadow-sm bg-background touch-none">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive z-10"
        onClick={handleClose}
        title="Close & Logout"
      >
        <X className="h-5 w-5" />
      </Button>

      <CardHeader className="space-y-1 text-center pt-6 pb-2 px-4">
        <div className="mb-2 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full">
            <Image 
              src="/Maharasa Logo_FA-01.png" 
              alt="Maharasa Logo" 
              fill 
              className="object-cover" 
              priority 
            />
          </div>
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">Kitchen Access</CardTitle>
        <CardDescription className="text-xs">Enter your 6-digit PIN to continue</CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* PIN Display Boxes */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isActive = pin.length === index && !isLoading;
              const isFilled = !!pin[index];
              return (
                <div
                  key={index}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 text-xl font-bold transition-all ${
                    isFilled 
                      ? "border-primary bg-primary/5 text-primary" 
                      : isActive 
                      ? "border-ring ring-2 ring-ring/20 bg-background animate-pulse" 
                      : "border-border bg-muted"
                  }`}
                >
                  {isFilled ? "●" : ""}
                </div>
              );
            })}
          </div>

          {/* Error Message Space */}
          <div className="h-5 flex items-center justify-center">
            {error && (
              <div className="text-center text-xs font-medium text-destructive animate-in fade-in-50 duration-200">
                {error}
              </div>
            )}
          </div>

          {/* Number Pad Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                disabled={isLoading || pin.length >= 6}
                className="h-14 bg-transparent text-xl font-semibold active:bg-muted touch-action-manipulation"
                onClick={() => handleNumberClick(num.toString())}
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="h-14 bg-transparent text-xs text-muted-foreground active:text-foreground touch-action-manipulation"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading || pin.length >= 6}
              className="h-14 bg-transparent text-xl font-semibold active:bg-muted touch-action-manipulation"
              onClick={() => handleNumberClick("0")}
            >
              0
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="h-14 bg-transparent text-xs text-muted-foreground active:text-foreground touch-action-manipulation"
              onClick={handleDelete}
            >
              Back
            </Button>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="h-12 w-full text-base mt-1" 
            disabled={pin.length !== 6 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Verifying..." : "Enter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}