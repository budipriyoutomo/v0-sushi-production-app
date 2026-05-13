"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getApiError } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export function KitchenPinLogin() {
  const router = useRouter()
  const { pinLogin } = useAuth()
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num)
      setError("")
    }
  }

  const handleClear = () => {
    setPin("")
    setError("")
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 6 ) return

    setIsLoading(true)
    setError("")

    try {
      await pinLogin({ pin })
      router.replace("/kitchen/dashboard")
    } catch (err) {
      const apiError = getApiError(err)
      setError(apiError.message || "Invalid PIN. Please try again.")
      setPin("")
    } finally {
      setIsLoading(false)
    }
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
                d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
              />
            </svg>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Kitchen Access</CardTitle>
        <CardDescription>Enter your 6-digit PIN to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className="w-12 h-12 rounded-lg border-2 border-border flex items-center justify-center text-xl font-bold bg-muted"
              >
                {pin[index] ? "●" : ""}
              </div>
            ))}
          </div>

          {error && <div className="text-sm text-destructive text-center font-medium">{error}</div>}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                size="lg"
                className="h-16 text-xl font-semibold bg-transparent"
                onClick={() => handleNumberClick(num.toString())}
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-16 text-base bg-transparent"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-16 text-xl font-semibold bg-transparent"
              onClick={() => handleNumberClick("0")}
            >
              0
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-16 text-base bg-transparent"
              onClick={handleDelete}
            >
              ←
            </Button>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full h-14 text-lg" size="lg" disabled={pin.length !== 6 || isLoading}>
            {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isLoading ? "Verifying..." : "Enter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
