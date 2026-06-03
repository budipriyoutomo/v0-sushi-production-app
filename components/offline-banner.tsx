"use client"

import { useConnectivityStore } from "@/stores/connectivity-store"
import { useOperationalUiStore } from "@/stores/operational-ui-store"

export function OfflineBanner() {
  const isOnline = useConnectivityStore((state) => state.isOnline)
  const pendingMutationCount = useConnectivityStore((state) => state.pendingMutationCount)
  const isRetryingQueue = useOperationalUiStore((state) => state.isRetryingQueue)

  if (isOnline && pendingMutationCount === 0 && !isRetryingQueue) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[90] border-b bg-background px-4 py-2 text-center text-sm font-medium shadow-sm">
      {!isOnline
        ? `Offline. ${pendingMutationCount} pending change${pendingMutationCount === 1 ? "" : "s"} will retry automatically.`
        : isRetryingQueue
          ? "Connection restored. Retrying pending changes..."
          : `${pendingMutationCount} pending change${pendingMutationCount === 1 ? "" : "s"} waiting to sync.`}
    </div>
  )
}
