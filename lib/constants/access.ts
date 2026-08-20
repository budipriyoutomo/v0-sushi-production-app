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
