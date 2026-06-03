type LogLevel = "info" | "warning" | "error"

export interface ErrorLogPayload {
  level?: LogLevel
  message: string
  error?: unknown
  tags?: Record<string, string>
  context?: Record<string, unknown>
}

export function logOperationalError(payload: ErrorLogPayload) {
  const level = payload.level ?? "error"

  if (process.env.NODE_ENV !== "production") {
    const logger = level === "error" ? console.error : level === "warning" ? console.warn : console.info
    logger("[ops]", payload.message, payload.error ?? "", payload.context ?? "")
  }

  // Sentry can be attached here later without touching callers.
}
