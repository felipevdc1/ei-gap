import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { PhaseEvent, ScanFormData } from '@/types/scanner'
import type { ScanStore } from '@/lib/store/interface'
import type { LLMClient } from '../pipeline'
import { _resetConfigCache } from '@/lib/config'

// ---------------------------------------------------------------------------
// Valid fixture data matching Zod schemas (same as pipeline.test.ts)
// ---------------------------------------------------------------------------

const validBusinessProfile = {
  company_name: 'TechCorp Solutions',
  sector: 'technology',
  company_size: '51-200',
  tech_maturity: 'medium',
  detected_sector: 'technology',
  key_processes: ['customer_support', 'invoice_processing', 'lead_qualification'],
  business_context: 'Mid-size technology company with moderate AI adoption potential.',
}

const validProcessMap = {
  processes: [
    {
      name: 'customer_support',
      category: 'operations',
      time_per_week: 20,
      pain_level: 4,
      automation_potential: 0.8,
      opportunities: ['chatbot_triage', 'auto_categorization'],
    },
  ],
}

const validScoredOpportunities = {
  opportunities: [
    {
      name: 'OCR Invoice Extraction',
      description: 'Automated extraction of invoice data using OCR and AI validation',
      category: 'finance',
      impact_score: 9,
      feasibility_score: 8,
      effort_score: 4,
      roi_score: 9,
      composite_score: 7.85,
      guardrails: ['manual_review_threshold', 'audit_trail'],
    },
  ],
}

const validRankedOpportunities = {
  opportunities: [
    {
      name: 'OCR Invoice Extraction',
      description: 'Automated extraction of invoice data using OCR and AI validation',
      category: 'finance',
      impact_score: 9,
      feasibility_score: 8,
      effort_score: 4,
      roi_score: 9,
      composite_score: 7.85,
      guardrails: ['manual_review_threshold', 'audit_trail'],
      rank: 1,
      roi_range_min: 50000,
      roi_range_max: 120000,
      loss_per_month: 8500,
      time_to_value: '2-4 weeks',
      quick_win: true,
    },
  ],
}

const validScanReport = {
  id: 'report-123',
  scan_id: 'scan-123',
  executive_summary: 'TechCorp Solutions has significant AI automation potential.',
  opportunities: validRankedOpportunities.opportunities,
  total_roi_min: 80000,
  total_roi_max: 200000,
  cost_of_inaction_monthly: 13500,
  gains_summary: 'Up to R$200k/year in efficiency gains.',
  losses_summary: 'R$13.5k/month lost to manual processes.',
  sector: 'technology',
  company_name: 'TechCorp Solutions',
  created_at: '2026-03-23T00:00:00.000Z',
}

const phaseResponses: Record<number, object> = {
  0: validBusinessProfile,
  1: validProcessMap,
  2: validScoredOpportunities,
  3: validRankedOpportunities,
  4: validScanReport,
}

const testFormData: ScanFormData = {
  sector: 'technology',
  company_name: 'TechCorp Solutions',
  company_size: '51-200',
  tech_maturity: 'medium',
  current_tools: 'Slack, Notion, Jira',
  sector_answers: {
    main_challenge: 'Too many manual processes in support and finance',
  },
  processes: [
    { name: 'customer_support', time_per_week: 20, pain_level: 4 },
    { name: 'invoice_processing', time_per_week: 15, pain_level: 5 },
    { name: 'lead_qualification', time_per_week: 10, pain_level: 3 },
  ],
}

function createMockStore(): ScanStore {
  return {
    saveScan: vi.fn().mockResolvedValue(undefined),
    getScan: vi.fn().mockResolvedValue(null),
    updateScanStatus: vi.fn().mockResolvedValue(undefined),
    saveReport: vi.fn().mockResolvedValue(undefined),
    getReport: vi.fn().mockResolvedValue(null),
    saveLead: vi.fn().mockResolvedValue(undefined),
  }
}

async function collectEvents(
  gen: AsyncGenerator<PhaseEvent>,
): Promise<PhaseEvent[]> {
  const events: PhaseEvent[] = []
  for await (const event of gen) {
    events.push(event)
  }
  return events
}

// ---------------------------------------------------------------------------
// Tests — Pipeline Total Timeout (120s)
// ---------------------------------------------------------------------------

describe('engine/pipeline — total pipeline timeout (120s)', () => {
  let mockStore: ScanStore

  beforeEach(() => {
    _resetConfigCache()
    vi.useFakeTimers()
    mockStore = createMockStore()
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('OPENROUTER_MODEL', 'test-model')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ei-gap.test')
    vi.stubEnv('NEXT_PUBLIC_CTA_URL', 'https://ei-gap.test/cta')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    _resetConfigCache()
  })

  it('aborts with scan_error if total pipeline exceeds 120 seconds', async () => {
    // Each LLM call takes 30s — 5 phases = 150s > 120s limit
    const mockLLM: LLMClient = vi.fn(async () => {
      // Simulate 30 second delay
      await new Promise((resolve) => setTimeout(resolve, 30_000))
      return JSON.stringify(validBusinessProfile)
    })

    const { runDiagnosis } = await import('../pipeline')
    const gen = runDiagnosis(testFormData, mockStore, mockLLM)
    const events: PhaseEvent[] = []

    // Consume events, advancing time as needed
    let done = false
    while (!done) {
      const advancePromise = gen.next()
      // Advance time to let the LLM call + timeout resolve
      await vi.advanceTimersByTimeAsync(31_000)
      const result = await advancePromise
      if (result.done) {
        done = true
      } else {
        events.push(result.value)
      }
    }

    // Should have scan_error event
    const errorEvent = events.find((e) => e.type === 'scan_error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.error).toContain('timeout')

    // Should NOT have scan_complete
    const completeEvent = events.find((e) => e.type === 'scan_complete')
    expect(completeEvent).toBeUndefined()
  })

  it('completes successfully when pipeline finishes within 120 seconds', async () => {
    // Each LLM call takes 10s — 5 phases = 50s < 120s limit
    let callIndex = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10_000))
      const response = phaseResponses[callIndex]
      callIndex++
      return JSON.stringify(response)
    })

    const { runDiagnosis } = await import('../pipeline')
    const gen = runDiagnosis(testFormData, mockStore, mockLLM)
    const events: PhaseEvent[] = []

    let done = false
    while (!done) {
      const advancePromise = gen.next()
      await vi.advanceTimersByTimeAsync(11_000)
      const result = await advancePromise
      if (result.done) {
        done = true
      } else {
        events.push(result.value)
      }
    }

    const scanComplete = events.find((e) => e.type === 'scan_complete')
    expect(scanComplete).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Tests — Exponential Backoff with Jitter on 429
// ---------------------------------------------------------------------------

describe('engine/pipeline — exponential backoff with jitter on 429', () => {
  let mockStore: ScanStore

  beforeEach(() => {
    _resetConfigCache()
    vi.useFakeTimers()
    mockStore = createMockStore()
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('OPENROUTER_MODEL', 'test-model')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ei-gap.test')
    vi.stubEnv('NEXT_PUBLIC_CTA_URL', 'https://ei-gap.test/cta')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    _resetConfigCache()
  })

  it('applies exponential backoff with jitter when LLM returns 429 rate limit error', async () => {
    const callTimestamps: number[] = []
    let callCount = 0

    const mockLLM: LLMClient = vi.fn(async () => {
      callTimestamps.push(Date.now())
      callCount++
      // First two calls: 429 rate limit
      if (callCount <= 2) {
        const error = new Error('Rate limit exceeded')
        ;(error as Error & { status?: number }).status = 429
        throw error
      }
      // Third call succeeds
      if (callCount === 3) return JSON.stringify(validBusinessProfile)
      const phaseIndex = callCount - 2
      return JSON.stringify(phaseResponses[phaseIndex] ?? validScanReport)
    })

    const { runDiagnosis } = await import('../pipeline')
    const gen = runDiagnosis(testFormData, mockStore, mockLLM)
    const events: PhaseEvent[] = []

    let done = false
    while (!done) {
      const advancePromise = gen.next()
      // Advance enough to cover max backoff
      await vi.advanceTimersByTimeAsync(15_000)
      const result = await advancePromise
      if (result.done) {
        done = true
      } else {
        events.push(result.value)
      }
    }

    // Should have retried and succeeded
    expect(callCount).toBeGreaterThanOrEqual(3)

    // Verify backoff: second call should be at least 1000ms after first (baseDelay)
    if (callTimestamps.length >= 2) {
      const delay1 = callTimestamps[1] - callTimestamps[0]
      expect(delay1).toBeGreaterThanOrEqual(1000)
    }

    // Third call should be further delayed (exponential)
    if (callTimestamps.length >= 3) {
      const delay2 = callTimestamps[2] - callTimestamps[1]
      // Second retry: baseDelay * 2^1 = 2000ms (+ jitter, so at least 2000)
      expect(delay2).toBeGreaterThanOrEqual(2000)
    }
  })

  it('caps backoff delay at maxDelay (10000ms)', async () => {
    // Spy on global setTimeout to capture the delays passed to it
    const backoffDelays: number[] = []
    const originalSetTimeout = globalThis.setTimeout
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn: any, delay?: number, ...args: unknown[]) => {
        // Track delays > 500ms (backoff delays, not microtask delays)
        if (delay && delay >= 500) {
          backoffDelays.push(delay)
        }
        return originalSetTimeout(fn, delay, ...args)
      },
    )

    let callCount = 0

    // Fail with 429 many times — check that delay never exceeds maxDelay + jitter
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      // Circuit breaker will trip at 3, so we won't get to 5
      // But the backoff delays should still be capped
      if (callCount <= 5) {
        const error = new Error('Rate limit exceeded')
        ;(error as Error & { status?: number }).status = 429
        throw error
      }
      return JSON.stringify(validBusinessProfile)
    })

    const { runDiagnosis } = await import('../pipeline')
    const gen = runDiagnosis(testFormData, mockStore, mockLLM)

    let done = false
    while (!done) {
      const advancePromise = gen.next()
      await vi.advanceTimersByTimeAsync(15_000)
      const result = await advancePromise
      if (result.done) {
        done = true
      } else {
        // consume event
      }
    }

    // All backoff delays should be <= maxDelay (10000ms) + jitter (up to 1000ms)
    for (const delay of backoffDelays) {
      expect(delay).toBeLessThanOrEqual(11_000)
    }

    setTimeoutSpy.mockRestore()
  })
})
