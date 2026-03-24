// ---------------------------------------------------------------------------
// EI-GAP — In-Memory Rate Limiter (Fixed Window)
// Story E2.S4 — Rate limiting por IP para rota /api/scan
// ---------------------------------------------------------------------------

interface WindowEntry {
  count: number
  windowStart: number
}

interface RateLimitOptions {
  /** Max requests per window. Default: 5 */
  limit?: number
  /** Window duration in milliseconds. Default: 1 hour */
  windowMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

const DEFAULT_LIMIT = 5
const DEFAULT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const store = new Map<string, WindowEntry>()

/**
 * Lazy cleanup: remove all entries whose window has expired.
 */
function cleanup(windowMs: number): void {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= windowMs) {
      store.delete(key)
    }
  }
}

/**
 * Check whether a request from `ip` is allowed under the fixed-window rate
 * limit. Each call counts as one request.
 */
export function checkRateLimit(
  ip: string,
  options?: RateLimitOptions,
): RateLimitResult {
  const limit = options?.limit ?? DEFAULT_LIMIT
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS
  const now = Date.now()

  // Lazy cleanup on every call
  cleanup(windowMs)

  const entry = store.get(ip)

  // No entry or window expired → start a fresh window
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(ip, { count: 1, windowStart: now })
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowMs),
    }
  }

  // Within current window
  entry.count += 1

  if (entry.count <= limit) {
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetAt: new Date(entry.windowStart + windowMs),
    }
  }

  // Over limit
  return {
    allowed: false,
    remaining: 0,
    resetAt: new Date(entry.windowStart + windowMs),
  }
}

/**
 * Build standard rate-limit response headers from a RateLimitResult.
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt.getTime() / 1000)),
  }
}

/**
 * Reset the internal store. Exported for testing only.
 */
export function _resetStore(): void {
  store.clear()
}
