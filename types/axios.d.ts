import "axios"

declare module "axios" {
  export interface AxiosRequestConfig {
    skipOfflineQueue?: boolean
    /**
     * Ditandai interceptor 401 sebelum mencoba ulang request dengan token yang
     * sudah disegarkan. Tanpa penanda ini, retry yang ikut gagal akan memicu
     * refresh lagi, lalu retry lagi — tak berujung.
     */
    authRetried?: boolean
  }
}
