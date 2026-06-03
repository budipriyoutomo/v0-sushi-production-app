import "axios"

declare module "axios" {
  export interface AxiosRequestConfig {
    skipOfflineQueue?: boolean
  }
}
