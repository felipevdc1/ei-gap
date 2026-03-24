// ---------------------------------------------------------------------------
// EI-GAP — POST /api/scan Route Tests (TDD — RED phase)
// Story E2.S5 — API routes com SSE streaming
// ---------------------------------------------------------------------------
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — vi.mock factories are hoisted, use vi.hoisted for shared refs
// ---------------------------------------------------------------------------

const {
  mockCheckRateLimit,
  mockGetRateLimitHeaders,
  mockSanitizeFormData,
  mockRunDiagnosis,
  mockStore,
} = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn(),
  mockGetRateLimitHeaders: vi.fn(),
  mockSanitizeFormData: vi.fn((data: unknown) => data),
  mockRunDiagnosis: vi.fn(),
  mockStore: {
    saveScan: vi.fn(),
    getScan: vi.fn(),
    updateScanStatus: vi.fn(),
    saveReport: vi.fn(),
    getReport: vi.fn(),
    saveLead: vi.fn(),
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getRateLimitHeaders: (...args: unknown[]) => mockGetRateLimitHeaders(...args),
}))

vi.mock('@/lib/engine/sanitizer', () => ({
  sanitizeFormData: (data: unknown) => mockSanitizeFormData(data),
}))

vi.mock('@/lib/engine/pipeline', () => ({
  runDiagnosis: (...args: unknown[]) => mockRunDiagnosis(...args),
}))

vi.mock('@/lib/store', () => ({
  store: mockStore,
}))

vi.mock('@/lib/config', () => ({
  getConfig: () => ({
    rateLimit: { perIp: 5 },
    openrouter: {
      apiKey: 'test-key',
      model: 'test-model',
      timeoutMs: 30000,
      maxRetries: 3,
      fallbackModel: undefined,
    },
    site: { url: 'http://localhost:3000', ctaUrl: '/cta' },
  }),
}))

import { POST } from '../route'
import type { PhaseEvent } from '@/types/scanner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_FORM_DATA = {
  sector: 'technology',
  company_name: 'Test Corp',
  company_size: '11-50' as const,
  tech_maturity: 'medium' as const,
  current_tools: 'Slack, Notion',
  sector_answers: { q1: 'answer1' },
  processes: [
    { name: 'Process A', time_per_week: 10, pain_level: 3 },
    { name: 'Process B', time_per_week: 5, pain_level: 2 },
    { name: 'Process C', time_per_week: 8, pain_level: 4 },
  ],
}

function createRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request('http://localhost:3000/api/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

/** Helper to collect all SSE events from a ReadableStream response */
async function collectSSEEvents(response: Response): Promise<Array<{ event: string; data: unknown }>> {
  const events: Array<{ event: string; data: unknown }> = []
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Parse SSE events from buffer
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      if (!part.trim()) continue
      const lines = part.split('\n')
      let eventType = ''
      let data = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.slice(7)
        if (line.startsWith('data: ')) data = line.slice(6)
      }
      if (eventType && data) {
        events.push({ event: eventType, data: JSON.parse(data) })
      }
    }
  }

  return events
}

/** Create an async generator from an array of PhaseEvents */
async function* makeAsyncGenerator(events: PhaseEvent[]): AsyncGenerator<PhaseEvent> {
  for (const event of events) {
    yield event
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/scan', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: rate limit allows
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remaining: 4,
      resetAt: new Date(Date.now() + 3600000),
    })
    mockGetRateLimitHeaders.mockReturnValue({
      'X-RateLimit-Remaining': '4',
      'X-RateLimit-Reset': '9999999999',
    })
  })

  // ---- AC: POST /api/scan with valid data returns SSE stream ----

  it('returns SSE stream with correct Content-Type for valid input', async () => {
    const events: PhaseEvent[] = [
      { type: 'phase_start', phase: 1, name: 'intake' },
      { type: 'phase_complete', phase: 1, name: 'intake', duration_ms: 100 },
      { type: 'scan_complete', phase: 5, name: 'report', reportId: 'report-123' },
    ]
    mockRunDiagnosis.mockReturnValue(makeAsyncGenerator(events))

    const request = createRequest(VALID_FORM_DATA)
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(response.headers.get('Cache-Control')).toBe('no-cache')
    expect(response.headers.get('Connection')).toBe('keep-alive')
  })

  it('emits SSE events for each pipeline phase', async () => {
    const events: PhaseEvent[] = [
      { type: 'phase_start', phase: 1, name: 'intake' },
      { type: 'phase_complete', phase: 1, name: 'intake', duration_ms: 100 },
      { type: 'phase_start', phase: 2, name: 'extraction' },
      { type: 'phase_complete', phase: 2, name: 'extraction', duration_ms: 200 },
      { type: 'scan_complete', phase: 5, name: 'report', reportId: 'rpt-abc' },
    ]
    mockRunDiagnosis.mockReturnValue(makeAsyncGenerator(events))

    const request = createRequest(VALID_FORM_DATA)
    const response = await POST(request)

    const sseEvents = await collectSSEEvents(response)

    expect(sseEvents).toHaveLength(5)
    expect(sseEvents[0]).toEqual({ event: 'phase_start', data: events[0] })
    expect(sseEvents[1]).toEqual({ event: 'phase_complete', data: events[1] })
    expect(sseEvents[4]).toEqual({ event: 'scan_complete', data: events[4] })
  })

  it('emits phase_retry and scan_error events', async () => {
    const events: PhaseEvent[] = [
      { type: 'phase_start', phase: 1, name: 'intake' },
      { type: 'phase_retry', phase: 1, name: 'intake', attempt: 1, reason: 'validation failed' },
      { type: 'scan_error', phase: 1, name: 'intake', error: 'max retries exceeded' },
    ]
    mockRunDiagnosis.mockReturnValue(makeAsyncGenerator(events))

    const request = createRequest(VALID_FORM_DATA)
    const response = await POST(request)
    const sseEvents = await collectSSEEvents(response)

    expect(sseEvents).toHaveLength(3)
    expect(sseEvents[1].event).toBe('phase_retry')
    expect(sseEvents[2].event).toBe('scan_error')
  })

  // ---- AC: POST /api/scan sanitizes input before pipeline ----

  it('sanitizes form data before passing to pipeline', async () => {
    const events: PhaseEvent[] = [
      { type: 'scan_complete', phase: 5, name: 'report', reportId: 'rpt-x' },
    ]
    mockRunDiagnosis.mockReturnValue(makeAsyncGenerator(events))

    const request = createRequest(VALID_FORM_DATA)
    await POST(request)

    expect(mockSanitizeFormData).toHaveBeenCalledWith(VALID_FORM_DATA)
    expect(mockRunDiagnosis).toHaveBeenCalledTimes(1)
  })

  // ---- AC: POST /api/scan with invalid data returns 400 ----

  it('returns 400 for missing required fields', async () => {
    const request = createRequest({ sector: 'tech' }) // missing many fields
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 for invalid company_size enum', async () => {
    const request = createRequest({
      ...VALID_FORM_DATA,
      company_size: 'huge', // invalid enum
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 400 for fewer than 3 processes', async () => {
    const request = createRequest({
      ...VALID_FORM_DATA,
      processes: [{ name: 'P1', time_per_week: 1, pain_level: 1 }],
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 400 for non-JSON body', async () => {
    const request = new Request('http://localhost:3000/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'x-forwarded-for': '127.0.0.1',
      },
      body: 'not json',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  // ---- AC: Rate limit returns 429 after 5 requests ----

  it('returns 429 when rate limit is exceeded', async () => {
    mockCheckRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 3600000),
    })
    mockGetRateLimitHeaders.mockReturnValue({
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': '9999999999',
    })

    const request = createRequest(VALID_FORM_DATA)
    const response = await POST(request)

    expect(response.status).toBe(429)
    const body = await response.json()
    expect(body.error).toMatch(/rate limit/i)
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('includes rate limit headers on successful responses', async () => {
    const events: PhaseEvent[] = [
      { type: 'scan_complete', phase: 5, name: 'report', reportId: 'rpt-x' },
    ]
    mockRunDiagnosis.mockReturnValue(makeAsyncGenerator(events))

    const request = createRequest(VALID_FORM_DATA)
    const response = await POST(request)

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4')
  })

  // ---- AC: IP hashing for rate limit ----

  it('hashes IP for rate limit check (does not pass raw IP)', async () => {
    const events: PhaseEvent[] = [
      { type: 'scan_complete', phase: 5, name: 'report', reportId: 'rpt-x' },
    ]
    mockRunDiagnosis.mockReturnValue(makeAsyncGenerator(events))

    const request = createRequest(VALID_FORM_DATA, { 'x-forwarded-for': '192.168.1.1' })
    await POST(request)

    // Rate limit should be called with a hashed IP, not the raw IP
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1)
    const calledWith = mockCheckRateLimit.mock.calls[0][0]
    expect(calledWith).not.toBe('192.168.1.1')
    expect(typeof calledWith).toBe('string')
    expect(calledWith.length).toBeGreaterThan(0)
  })
})
