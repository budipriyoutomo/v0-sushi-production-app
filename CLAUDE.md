# Frontend — Next.js PWA

Next.js 16 (App Router) / React 19 / TypeScript / Tailwind v4 / shadcn-ui. Dirancang untuk **tablet di dapur dengan koneksi tidak stabil** — offline-first bukan fitur tambahan, tapi asumsi dasar.

Baca dulu [../CLAUDE.md](../CLAUDE.md) untuk konteks domain.

Asal-usul: project ini di-generate dari v0.app (lihat `README.md`), lalu dikeraskan secara bertahap. Nama package masih `my-v0-project`.

---

## Struktur

```
app/            # App Router — hanya routing + layout, isinya tipis
  admin/        # master data (outlets, users, plate colors, menus, waste reasons)
  kitchen/      # conveyor, produce, expired, dashboard  (layar tablet)
  production/   # planning, waste
  operation/    # sales-input, closing-report
  report/       # daily-summary, waste-analysis, closing-reports, production-item-list
  login/        # /login, /login/admin (email+password), /login/kitchen (PIN)
  offline/      # fallback dokumen untuk service worker
components/     # SEMUA layar sebenarnya ada di sini, flat, satu file per layar
  ui/           # primitif shadcn
hooks/          # wrapper SWR per domain (use-production, use-menus, ...)
lib/
  api/          # batas API: client.ts (axios) + base-service.ts + services/*
  config.ts     # base URL + helper token
  types.ts      # tipe domain lintas-fitur
services/       # layanan browser lintas-fitur: offline-queue, api-errors, error-logger
stores/         # Zustand: auth, connectivity, outlet aktif, UI operasional
tests/          # Vitest + Testing Library
docs/           # keputusan arsitektur (sudah ada sebelumnya, tetap berlaku)
modules/        # kosong, dicadangkan untuk modularisasi masa depan
```

Halaman di `app/` sengaja tipis — biasanya hanya `<AuthGuard>` membungkus satu komponen dari `components/`. Cari implementasinya di `components/`, bukan di `app/`.

`docs/` yang sudah ada tetap jadi rujukan: [architecture-decisions.md](docs/architecture-decisions.md), [offline-strategy.md](docs/offline-strategy.md), [pwa-strategy.md](docs/pwa-strategy.md), [future-realtime.md](docs/future-realtime.md).

---

## Rantai Data (jangan dipotong)

```
Komponen  →  hooks/use-*.ts (SWR)  →  lib/api/services/*.ts  →  lib/api/client.ts (axios)
```

Jangan pernah memanggil `apiClient` langsung dari komponen. Hook memegang cache key + revalidasi; service memegang bentuk request/response dan transformasi.

Contoh transformasi yang hidup di service: `productionService.savePlan()` memuat master plate color sekali, lalu mengubah baris plan berbentuk `{ timeSlot, white: 5, blue: 3 }` menjadi `{ timeSlot, items: [{ plateColorId, qty }] }` yang diminta backend. Warna yang tidak ada di master → melempar error. Cache `colorMap` bersifat per-instance dan tidak pernah di-invalidate selama sesi.

### Konfigurasi SWR global (`components/providers.tsx`)
```
revalidateOnFocus: false        # tablet dapur sering berpindah fokus
revalidateOnReconnect: true
shouldRetryOnError: isTransientApiError
errorRetryCount: 2
errorRetryInterval: 5000
```
Data conveyor & stats di-poll `refreshInterval: 30000`. Belum ada realtime — rencananya di [docs/future-realtime.md](docs/future-realtime.md).

---

## Offline & Antrean Mutasi

Ini bagian paling halus di frontend. Baca `services/offline-queue.ts` sebelum menyentuh apa pun di jalur mutasi.

**Alur:**
1. Request interceptor menempelkan `Authorization` + `X-Client-Request-Id` (UUID unik per aksi user) ke setiap POST/PUT/PATCH.
2. Kalau request gagal dengan error transien (`isTransientApiError`: tanpa status, 408/425/429, ≥500, `ERR_NETWORK`, timeout), response interceptor memasukkannya ke IndexedDB (`maharasa-offline-queue`).
3. `ConnectivityMonitor` mendengarkan event `online`/`offline`, memperbarui `connectivity-store`, dan mengosongkan antrean saat koneksi kembali.
4. `drainOfflineQueue()` mengirim ulang urut waktu pembuatan. Sukses → dihapus. Error non-transien atau ≥8 percobaan → dibuang (dead-letter) dan drain lanjut. Error transien → berhenti, coba lagi nanti.

**Dua jenis ID, jangan tertukar:**
- `createRequestId()` — UUID acak, **unik per aksi user**. Ini yang jadi kunci idempotensi di server. Dua aksi identik yang sah (produksi item sama dua kali) harus punya id berbeda, kalau tidak backend akan memutar ulang respons pertama dan diam-diam membuang yang kedua.
- `createQueueRequestId()` — hash isi request. Hanya dipakai sebagai kunci dedup antrean ketika header belum ada.

**Yang tidak diantre:** endpoint auth (`/login`, `/login-pin`, `/logout`, `/auth/refresh`) dan payload `FormData` (upload foto waste).

Header `Authorization` sengaja tidak ikut disimpan (`normalizeHeaders` membuangnya) — token segar dipasang ulang oleh interceptor saat retry.

---

## State (Zustand)

| Store | Persist | Isi |
|-------|---------|-----|
| `auth-store` | `maharasa-auth-session` | `user`, `status`, `lastRestoredAt` |
| `outlet-store` | `maharasa-active-outlet` | `selectedOutletId` |
| `connectivity-store` | — | `isOnline`, `pendingMutationCount`, timestamp |
| `operational-ui-store` | — | status drain antrean |

Token JWT sendiri ada di `localStorage` (`auth_token`), dikelola `lib/config.ts`, terpisah dari store.

**Pemulihan sesi (`hooks/use-auth.tsx`) — perilaku sengaja:**
- API 401/404 saat restore → sesi dibersihkan.
- API error transien (backend down / offline) → sesi **dipertahankan**, status tetap `authenticated`. Operator tidak boleh terlempar keluar hanya karena wifi dapur putus.
- Interceptor 401 menghapus token tapi **tidak** melakukan hard redirect — `AuthGuard` yang memutuskan.

---

## Otorisasi Halaman

`components/auth-guard.tsx` melakukan tiga pemeriksaan: terautentikasi → `allowedRoles` (opsional) → akses modul.

Akses modul diambil dari `user.module_app`. Kalau prop `allowedModules` diberikan, itu yang berlaku; kalau tidak, segmen pertama pathname dipakai (`/kitchen/conveyor` → modul `kitchen`). Gagal → dialihkan ke modul pertama yang dimiliki user, atau `/login`.

`components/sidebar-nav.tsx` memfilter section navigasi dengan `module_app` yang sama. Kalau menambah halaman baru, daftarkan di kedua tempat.

Ini otorisasi sisi klien saja — kenyamanan, bukan keamanan. Penegakan sebenarnya harus ada di backend (dan saat ini banyak endpoint belum menegakkannya, lihat [../docs/known-issues.md](../docs/known-issues.md)).

---

## PWA

`next-pwa` dikonfigurasi di `next.config.mjs`, nonaktif di development.

Strategi cache:
- **CacheFirst** — `/_next/static/*`, font Google, gambar
- **NetworkFirst, timeout 3 detik** — semua GET `/api/*` (cache 5 menit) dan navigasi halaman (cache 24 jam)
- Fallback dokumen: `/offline`

Dua setelan yang sudah disetel sengaja, jangan diubah tanpa alasan kuat:
- `reloadOnOnline: false` — di internet berkedip, event online/offline memicu full reload berulang. Pemulihan sudah ditangani `ConnectivityMonitor` + `revalidateOnReconnect`.
- `networkTimeoutSeconds: 3` (bukan 8) — 8 detik membuat UI dapur menggantung terlalu lama sebelum jatuh ke cache.

`public/sw.js`, `public/workbox-*.js`, `public/fallback-*.js` adalah artefak build. Jangan diedit manual.

---

## Testing

```bash
npm test
npm run test:watch
npx vitest run tests/services/offline-queue.test.ts
```

Vitest + jsdom + Testing Library, setup di `tests/setup.ts`, `fake-indexeddb` untuk menguji antrean offline. Alias `@/` dipetakan di `vitest.config.mts` mencerminkan `tsconfig.json`.

---

## Jebakan

- **Typecheck menggagalkan build** (`ignoreBuildErrors: false`). `npx tsc --noEmit` saat ini bersih — jaga tetap begitu, jangan hidupkan lagi flag itu untuk melewati error.
- **`lib/types.ts` sudah melenceng dari backend.** `PlateColor` masih berupa union string literal (`"white" | "blue" | ...`) padahal backend memakai UUID plate color yang dinamis dari master data. `ProductionItem` di `lib/types.ts` juga berbeda dari `ProductionItem` di `lib/api/services/production.ts` — yang dipakai kode aktif adalah yang di service. Rapikan sebelum menambah fitur di area ini.
- **Bentuk respons backend tidak seragam.** Sebagian endpoint mengembalikan `{ status, message, data }`, sebagian `{ success, data }`. Service frontend menyesuaikan satu per satu. Cek bentuk aktualnya saat menambah endpoint.
