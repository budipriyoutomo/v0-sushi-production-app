import axios from "axios"

export function isTransientApiError(error: unknown) {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  const code = error.code
  const message = error.message || ""

  return (
    !status ||
    status === 408 ||
    status === 425 ||
    status === 429 ||
    status >= 500 ||
    code === "ECONNABORTED" ||
    code === "ERR_NETWORK" ||
    message.includes("timeout") ||
    message.includes("Network Error")
  )
}

export function isAuthInvalidError(error: unknown) {
  return axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 404)
}
