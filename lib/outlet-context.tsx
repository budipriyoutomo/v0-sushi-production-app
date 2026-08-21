'use client'

import { createContext, useContext, ReactNode, useEffect, useMemo } from 'react'
import type { Outlet } from './types'
import { useActiveOutlets } from '@/hooks/use-outlets' 
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useOutletStore } from '@/stores/outlet-store'

interface OutletContextType {
  selectedOutletId: string
  setSelectedOutletId: (id: string) => void
  outlets: Outlet[]
  isLoading: boolean
}

const OutletContext = createContext<OutletContextType | undefined>(undefined)

export function OutletProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const shouldFetch = pathname !== '/login'

  const { outlets: allOutlets, isLoading } = useActiveOutlets(shouldFetch ? undefined : null)
  const storedOutletId = useOutletStore((state) => state.selectedOutletId)
  const setSelectedOutletId = useOutletStore((state) => state.setSelectedOutletId)

  // Filter outlets based on user's allowed outlet codes
  // Admin role bypasses filter and gets all outlets
  const outlets = useMemo(() => {
    if (!user || !user.outlet || user.role === 'admin') {
      return allOutlets
    }

    const allowedOutletCodes = new Set(
      user.outlet.map((code) => code.trim().toLowerCase())
    )

    // Filter outlets by matching normalized outlet codes.
    return allOutlets.filter((outlet) =>
      allowedOutletCodes.has(outlet.code.trim().toLowerCase())
    )
  }, [allOutlets, user])

  /**
   * Outlet yang tersimpan baru dipercaya setelah terbukti ada di daftar yang
   * boleh dilihat user ini.
   *
   * `selectedOutletId` disimpan di localStorage dan bertahan lintas pengguna —
   * tablet dapur dipakai bergantian. Versi sebelumnya memakainya mentah dan
   * baru mengoreksi lewat effect di bawah, yang dijaga `outlets.length > 0`,
   * jadi ada jendela antara halaman terbuka dan `/master/outlet` menjawab.
   * Selama jendela itu setiap hook sudah menembak dengan outlet milik pengguna
   * sebelumnya: `outletScopedKey()` tidak menahannya karena ia gagal-tertutup
   * untuk outlet **kosong**, bukan outlet **basi**.
   *
   * Server memang menolak lewat `outlet.access`, tapi tidak selalu — dua user
   * yang sama-sama memegang outlet itu tidak kena 403, dan admin melewati
   * pemeriksaannya sepenuhnya. Yang muncul bukan kebocoran melainkan salah
   * atribusi: piring tercatat ke outlet yang keliru, tanpa ada yang menandai.
   *
   * Nilai turunan ini gagal-tertutup: selama daftar outlet belum ada, tidak ada
   * outlet yang terpilih, dan tidak ada yang di-fetch.
   */
  const selectedOutletId = useMemo(
    () => (outlets.some((outlet) => outlet.id === storedOutletId) ? storedOutletId : ''),
    [outlets, storedOutletId]
  )

  // Pilih outlet pertama begitu daftarnya ada dan belum ada yang terpilih —
  // termasuk saat pilihan tersimpan ternyata bukan milik user ini.
  useEffect(() => {
    if (!selectedOutletId && outlets.length > 0) {
      setSelectedOutletId(outlets[0].id)
    }
  }, [outlets, selectedOutletId, setSelectedOutletId])

  return (
    <OutletContext.Provider value={{ selectedOutletId, setSelectedOutletId, outlets, isLoading }}>
      {children}
    </OutletContext.Provider>
  )
}

export function useOutlet() {
  const context = useContext(OutletContext)
  if (context === undefined) {
    throw new Error('useOutlet must be used within OutletProvider')
  }
  return context
}
