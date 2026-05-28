"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getApiError } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, X } from "lucide-react"

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

  const handleClose = () => {
    window.close()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 6) return

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
    <Card className="w-full max-w-md relative">
      {/* Close Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={handleClose}
        title="Close"
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32 rounded-full flex items-center justify-center">
            <Image
              src="/Maharasa Logo_FA-01.png"
              alt="Maharasa Logo"
              fill
              className="object-cover"
            />
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