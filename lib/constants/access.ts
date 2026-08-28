/**
 * Daftar role dan module_app yang sah.
 *
 * Static, bukan diambil dari API: nilainya ikut kode. `module_app` menentukan
 * halaman mana yang dibuka `AuthGuard` dan `SidebarNav`, jadi nilai yang tidak
 * punya halaman tidak berarti apa-apa.
 *
 * Harus sama persis dengan `backend/src/app/Support/AccessOptions.php`.
 */

/**
 * Role `service` sudah dihapus: izinnya di backend identik dengan `kitchen`
 * (keduanya hanya boleh membaca master), jadi memisahkannya tidak pernah
 * menjaga apa pun. Modul `service` di bawah **tetap ada** — itu sumbu lain.
 */
export const USER_ROLES = [
  'admin',
  'manager',
  'kitchen',
  'operation',
  'production',
] as const

/**
 * `app` adalah modul dasar tanpa halaman sendiri — dilewati saat mencari
 * modul tujuan redirect di `auth-guard.tsx`.
 *
 * `service` bertahan walau role bernama sama sudah hilang: modul inilah yang
 * sekarang memisahkan staf service dari staf kitchen, dan `app/kitchen/layout.tsx`
 * masih menerimanya sebagai jalan masuk ke layar dapur.
 */
export const MODULE_APPS = [
  'app',
  'production',
  'kitchen',
  'service',
  'report',
  'admin',
  'operation',
] as const

export type UserRoleOption = (typeof USER_ROLES)[number]
export type ModuleApp = (typeof MODULE_APPS)[number]

/** Label untuk dropdown / checkbox di layar admin. */
export const USER_ROLE_LABELS: Record<UserRoleOption, string> = {
  admin: 'Admin',
  manager: 'Manager',
  kitchen: 'Kitchen',
  operation: 'Operation',
  production: 'Production',
}

export const MODULE_APP_LABELS: Record<ModuleApp, string> = {
  app: 'App (dasar)',
  production: 'Production',
  kitchen: 'Kitchen',
  service: 'Service',
  report: 'Report',
  admin: 'Admin',
  operation: 'Operation',
}

export function isModuleApp(value: string): value is ModuleApp {
  return (MODULE_APPS as readonly string[]).includes(value)
}

/**
 * Halaman pertama tiap modul.
 *
 * `app` tidak ada di sini — ia modul dasar tanpa halaman sendiri. `service`
 * menunjuk layar dapur yang sama dengan `kitchen`, karena `app/kitchen/layout.tsx`
 * memang menerima keduanya.
 */
export const MODULE_LANDING: Record<Exclude<ModuleApp, 'app'>, string> = {
  admin: '/admin/plate-colors',
  operation: '/operation/sales-input',
  production: '/production/planning',
  report: '/report/production-item-list',
  kitchen: '/kitchen/dashboard',
  service: '/kitchen/dashboard',
}

/**
 * Urutan yang menentukan modul mana jadi tujuan kalau user punya beberapa.
 *
 * Versi sebelumnya menulis komentar "priority order" di atas tabel rute, tapi
 * yang diiterasi justru `module_app` milik user — jadi pemenangnya adalah modul
 * yang kebetulan tercatat paling awal di array itu, dan array itu urutannya
 * mengikuti urutan centang di layar User Management. Dua user dengan izin
 * identik bisa mendarat di halaman berbeda tanpa ada yang memutuskan begitu.
 *
 * Prioritasnya sekarang di sini, dan hanya di sini.
 */
export const MODULE_PRIORITY: Array<Exclude<ModuleApp, 'app'>> = [
  'admin',
  'operation',
  'production',
  'report',
  'kitchen',
  'service',
]

/**
 * Halaman tujuan untuk user ini, atau `null` kalau ia tidak punya modul
 * berhalaman satu pun.
 *
 * `null` bukan kelalaian: `module_app` kosong berarti tidak punya akses, dan
 * pemanggil harus memperlakukannya sebagai gagal-tertutup — kirim ke `/login`,
 * jangan tebak halaman mana pun.
 */
export function landingRouteFor(moduleApp: string[] | undefined | null): string | null {
  const modules = Array.isArray(moduleApp) ? moduleApp : []

  for (const mod of MODULE_PRIORITY) {
    if (modules.includes(mod)) return MODULE_LANDING[mod]
  }

  return null
}
