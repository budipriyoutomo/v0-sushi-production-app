"use client"

import { useConnectivityStore } from "@/stores/connectivity-store"

export function useConnectivity() {
  return useConnectivityStore()
}
