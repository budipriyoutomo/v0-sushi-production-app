"use client"

import { useEffect, useRef } from "react"
import { drainOfflineQueue, getQueuedRequestCount } from "@/services/offline-queue"
import { logOperationalError } from "@/services/error-logger"
import { useConnectivityStore } from "@/stores/connectivity-store"
import { useOperationalUiStore } from "@/stores/operational-ui-store"
import { toast } from "@/hooks/use-toast"

export function ConnectivityMonitor() {
  const hasMounted = useRef(false)

  useEffect(() => {
    let isDisposed = false

    async function refreshQueueCount() {
      const count = await getQueuedRequestCount()
      if (!isDisposed) {
        useConnectivityStore.getState().setPendingMutationCount(count)
      }
    }

    async function retryQueue() {
      if (!navigator.onLine) return

      useOperationalUiStore.getState().setQueueRetrying(true)

      try {
        const result = await drainOfflineQueue()
        useConnectivityStore.getState().setPendingMutationCount(result.remaining)
        useOperationalUiStore.getState().markQueueDrained()

        if (result.retried > 0) {
          toast({
            title: "Pending changes synced",
            description: `${result.retried} queued operation${result.retried === 1 ? "" : "s"} completed.`,
          })
        }
      } catch (error) {
        useOperationalUiStore.getState().setQueueRetrying(false)
        logOperationalError({
          level: "warning",
          message: "Queue drain failed",
          error,
        })
      }
    }

    function handleOnline() {
      useConnectivityStore.getState().setOnline(true)
      if (hasMounted.current) {
        toast({ title: "Connection restored", description: "Retrying pending kitchen changes." })
      }
      void retryQueue()
    }

    function handleOffline() {
      useConnectivityStore.getState().setOnline(false)
      if (hasMounted.current) {
        toast({
          title: "Offline mode",
          description: "The app will keep the screen available and retry writes later.",
          variant: "destructive",
        })
      }
      void refreshQueueCount()
    }

    useConnectivityStore.getState().setOnline(navigator.onLine)
    void refreshQueueCount()
    if (navigator.onLine) void retryQueue()

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    const interval = window.setInterval(refreshQueueCount, 15000)
    hasMounted.current = true

    return () => {
      isDisposed = true
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.clearInterval(interval)
    }
  }, [])

  return null
}
