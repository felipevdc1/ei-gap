// ---------------------------------------------------------------------------
// EI-GAP — Rate Limiter In-Memory Tests (TDD — RED phase)
// Story E2.S4 — Rate limiting por IP para rota /api/scan
// ---------------------------------------------------------------------------
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  checkRateLimit,
  getRateLimitHeaders,
  _resetStore,
} from '../rate-limit'

// ---------------------------------------------------------------------------
// Basic rate-limit behavior (fixed window)
// ---------------------------------------------------------------------------

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _resetStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- AC: 5 requests pass, 6th is blocked ----

  it('allows requests up to the limit', () => {
    const limit = 5

    for (let i = 0; i < limit; i++) {
      const result = checkRateLimit('192.168.1.1', { limit })
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(limit - 1 - i)
    }
  })

  it('blocks the request that exceeds the limit', () => {
    const limit = 5

    // Exhaust the limit
    for (let i = 0; i < limit; i++) {
      checkRateLimit('192.168.1.1', { limit })
    }

    // 6th request should be blocked
    const result = checkRateLimit('192.168.1.1', { limit })
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  // ---- AC: after 1h, counter resets ----

  it('resets counter after window expires (1 hour)', () => {
    const limit = 5
    const windowMs = 60 * 60 * 1000 // 1 hour

    // Exhaust the limit
    for (let i = 0; i < limit; i++) {
      checkRateLimit('192.168.1.1', { limit, windowMs })
    }

    // Blocked now
    expect(checkRateLimit('192.168.1.1', { limit, windowMs }).allowed).toBe(
      false
    )

    // Advance past 1 hour
    vi.advanceTimersByTime(windowMs + 1)

    // Should be allowed again with full quota
    const result = checkRateLimit('192.168.1.1', { limit, windowMs })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(limit - 1)
  })

  // ---- AC: different IPs have independent counters ----

  it('tracks IPs independently', () => {
    const limit = 5

    // Exhaust limit for IP A
    for (let i = 0; i < limit; i++) {
      checkRateLimit('10.0.0.1', { limit })
    }
    expect(checkRateLimit('10.0.0.1', { limit }).allowed).toBe(false)

    // IP B should still have full quota
    const result = checkRateLimit('10.0.0.2', { limit })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(limit - 1)
  })

  // ---- resetAt date ----

  it('returns resetAt as a Date in the future', () => {
    const now = new Date('2026-01-15T10:00:00Z')
    vi.setSystemTime(now)

    const windowMs = 60 * 60 * 1000
    const result = checkRateLimit('192.168.1.1', { limit: 5, windowMs })

    expect(result.resetAt).toBeInstanceOf(Date)
    expect(result.resetAt.getTime()).toBe(now.getTime() + windowMs)
  })

  // ---- Default values ----

  it('uses default limit of 5 and window of 1 hour when not specified', () => {
    const result = checkRateLimit('192.168.1.1')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4) // 5 - 1
  })

  // ---- remaining count accuracy ----

  it('reports remaining accurately at each step', () => {
    const limit = 3

    expect(checkRateLimit('1.1.1.1', { limit }).remaining).toBe(2)
    expect(checkRateLimit('1.1.1.1', { limit }).remaining).toBe(1)
    expect(checkRateLimit('1.1.1.1', { limit }).remaining).toBe(0)
    // After limit, remaining stays at 0
    expect(checkRateLimit('1.1.1.1', { limit }).remaining).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Automatic cleanup of old entries (memory leak prevention)
// ---------------------------------------------------------------------------

describe('checkRateLimit — cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _resetStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cleans up expired entries on subsequent calls (lazy cleanup)', () => {
    const windowMs = 60 * 60 * 1000
    const limit = 5

    // Create entries for multiple IPs
    checkRateLimit('ip-1', { limit, windowMs })
    checkRateLimit('ip-2', { limit, windowMs })
    checkRateLimit('ip-3', { limit, windowMs })

    // Advance past window
    vi.advanceTimersByTime(windowMs + 1)

    // A new call should trigger cleanup — old entries are gone
    // and the new IP gets a fresh window
    const result = checkRateLimit('ip-4', { limit, windowMs })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(limit - 1)

    // Old IPs should also get fresh windows (their entries were cleaned)
    const resultOld = checkRateLimit('ip-1', { limit, windowMs })
    expect(resultOld.allowed).toBe(true)
    expect(resultOld.remaining).toBe(limit - 1)
  })
})

// ---------------------------------------------------------------------------
// getRateLimitHeaders
// ---------------------------------------------------------------------------

describe('getRateLimitHeaders', () => {
  it('returns correct headers for an allowed request', () => {
    const resetAt = new Date('2026-01-15T11:00:00Z')
    const headers = getRateLimitHeaders({
      allowed: true,
      remaining: 3,
      resetAt,
    })

    expect(headers['X-RateLimit-Remaining']).toBe('3')
    expect(headers['X-RateLimit-Reset']).toBe(
      String(Math.ceil(resetAt.getTime() / 1000))
    )
  })

  it('returns correct headers for a blocked request', () => {
    const resetAt = new Date('2026-01-15T11:00:00Z')
    const headers = getRateLimitHeaders({
      allowed: false,
      remaining: 0,
      resetAt,
    })

    expect(headers['X-RateLimit-Remaining']).toBe('0')
    expect(headers['X-RateLimit-Reset']).toBe(
      String(Math.ceil(resetAt.getTime() / 1000))
    )
  })
})
