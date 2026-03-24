import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { PhaseEvent, ScanFormData } from '@/types/scanner'
import type { ScanStore } from '@/lib/store/interface'
import type { LLMClient } from '../pipeline'
import { _resetConfigCache } from '@/lib/config'

// ---------------------------------------------------------------------------
// Valid fixture data matching Zod schemas
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
// Tests — Circuit Breaker (3 consecutive failures across phases → abort)
// ---------------------------------------------------------------------------

describe('engine/pipeline — circuit breaker', () => {
  let mockStore: ScanStore

  beforeEach(() => {
    _resetConfigCache()
    mockStore = createMockStore()
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('OPENROUTER_MODEL', 'test-model')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ei-gap.test')
    vi.stubEnv('NEXT_PUBLIC_CTA_URL', 'https://ei-gap.test/cta')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    _resetConfigCache()
  })

  it('aborts after 3 consecutive LLM call failures with circuit breaker error', async () => {
    // Every call fails — circuit breaker should trip after 3 consecutive failures
    const mockLLM: LLMClient = vi.fn(async () => {
      throw new Error('Service unavailable')
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Should have scan_error with circuit breaker message
    const errorEvent = events.find((e) => e.type === 'scan_error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.error).toContain('circuit breaker')

    // Circuit breaker should trip BEFORE exhausting all maxRetries
    // With default maxRetries=3, normal behavior would be 4 calls (1+3 retries).
    // Circuit breaker trips at 3 consecutive failures, so LLM called exactly 3 times.
    expect(mockLLM).toHaveBeenCalledTimes(3)
  })

  it('resets consecutive failure count on success', async () => {
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      // Phase 1: fail twice, succeed on third
      if (callCount === 1) throw new Error('Fail 1')
      if (callCount === 2) throw new Error('Fail 2')
      if (callCount === 3) return JSON.stringify(validBusinessProfile)
      // Phase 2: fail once, succeed
      if (callCount === 4) throw new Error('Fail after reset')
      if (callCount === 5) return JSON.stringify(validProcessMap)
      // Remaining phases succeed
      const phaseIndex = callCount - 4
      return JSON.stringify(phaseResponses[phaseIndex] ?? validScanReport)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Should NOT have circuit breaker error — count resets on success
    const errorEvent = events.find(
      (e) => e.type === 'scan_error' && e.error?.includes('circuit breaker'),
    )
    expect(errorEvent).toBeUndefined()

    // Pipeline should complete (or at least proceed past phase 1)
    const phase1Complete = events.find(
      (e) => e.type === 'phase_complete' && e.phase === 1,
    )
    expect(phase1Complete).toBeDefined()
  })

  it('counts failures across different phases for circuit breaker', async () => {
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      // Phase 1: succeed on first attempt
      if (callCount === 1) return JSON.stringify(validBusinessProfile)
      // Phase 2: fail 3 times consecutively → circuit breaker trips
      if (callCount >= 2 && callCount <= 4) {
        throw new Error('Consecutive failure')
      }
      // Should never reach here
      return JSON.stringify(validProcessMap)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const errorEvent = events.find((e) => e.type === 'scan_error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.error).toContain('circuit breaker')
  })
})

// ---------------------------------------------------------------------------
// Tests — Fallback Model
// ---------------------------------------------------------------------------

describe('engine/pipeline — fallback model', () => {
  let mockStore: ScanStore

  beforeEach(() => {
    _resetConfigCache()
    mockStore = createMockStore()
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('OPENROUTER_MODEL', 'test-model')
    vi.stubEnv('OPENROUTER_FALLBACK_MODEL', 'fallback-model')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ei-gap.test')
    vi.stubEnv('NEXT_PUBLIC_CTA_URL', 'https://ei-gap.test/cta')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    _resetConfigCache()
  })

  it('tries fallback model when primary fails with model error', async () => {
    const modelsUsed: Array<string | undefined> = []
    let callCount = 0

    const mockLLM: LLMClient = vi.fn(async (_system, _user, options) => {
      modelsUsed.push(options?.model)
      callCount++
      // First call (primary model): fail with model error
      if (callCount === 1) {
        const error = new Error('Model not available')
        ;(error as Error & { status?: number }).status = 500
        throw error
      }
      // Second call (fallback model): succeed
      if (callCount === 2) return JSON.stringify(validBusinessProfile)
      // Remaining phases
      const phaseIndex = callCount - 2
      return JSON.stringify(phaseResponses[phaseIndex] ?? validScanReport)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Fallback model should have been used
    expect(modelsUsed).toContain('fallback-model')

    // Pipeline should complete
    const scanComplete = events.find((e) => e.type === 'scan_complete')
    expect(scanComplete).toBeDefined()
  })

  it('does not use fallback model when OPENROUTER_FALLBACK_MODEL is not configured', async () => {
    vi.stubEnv('OPENROUTER_FALLBACK_MODEL', '')

    const modelsUsed: Array<string | undefined> = []
    let callCount = 0

    const mockLLM: LLMClient = vi.fn(async (_system, _user, options) => {
      modelsUsed.push(options?.model)
      callCount++
      // First call fails
      if (callCount === 1) {
        const error = new Error('Model not available')
        ;(error as Error & { status?: number }).status = 500
        throw error
      }
      // Retry without fallback
      if (callCount === 2) return JSON.stringify(validBusinessProfile)
      const phaseIndex = callCount - 2
      return JSON.stringify(phaseResponses[phaseIndex] ?? validScanReport)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Should never have used fallback model
    expect(modelsUsed).not.toContain('fallback-model')
  })

  it('tries fallback on 429 rate limit error', async () => {
    const modelsUsed: Array<string | undefined> = []
    let callCount = 0

    const mockLLM: LLMClient = vi.fn(async (_system, _user, options) => {
      modelsUsed.push(options?.model)
      callCount++
      if (callCount === 1) {
        const error = new Error('Rate limited')
        ;(error as Error & { status?: number }).status = 429
        throw error
      }
      if (callCount === 2) return JSON.stringify(validBusinessProfile)
      const phaseIndex = callCount - 2
      return JSON.stringify(phaseResponses[phaseIndex] ?? validScanReport)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Fallback model should have been tried
    expect(modelsUsed).toContain('fallback-model')
  })
})

// ---------------------------------------------------------------------------
// Tests — Max Retries (no infinite loop)
// ---------------------------------------------------------------------------

describe('engine/pipeline — max retries prevents infinite loops', () => {
  let mockStore: ScanStore

  beforeEach(() => {
    _resetConfigCache()
    mockStore = createMockStore()
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('OPENROUTER_MODEL', 'test-model')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ei-gap.test')
    vi.stubEnv('NEXT_PUBLIC_CTA_URL', 'https://ei-gap.test/cta')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    _resetConfigCache()
  })

  it('respects OPENROUTER_MAX_RETRIES env var', async () => {
    vi.stubEnv('OPENROUTER_MAX_RETRIES', '2')

    const mockLLM: LLMClient = vi.fn(async () => {
      return JSON.stringify({ invalid: 'data' })
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const retryEvents = events.filter((e) => e.type === 'phase_retry')
    // maxRetries=2 means 2 retries (3 total calls: 1 initial + 2 retries)
    expect(retryEvents.length).toBe(2)
    expect(mockLLM).toHaveBeenCalledTimes(3)

    // Should error, not loop forever
    const errorEvent = events.find((e) => e.type === 'scan_error')
    expect(errorEvent).toBeDefined()
  })

  it('never calls LLM more than 1 + maxRetries times per phase', async () => {
    vi.stubEnv('OPENROUTER_MAX_RETRIES', '5')

    const mockLLM: LLMClient = vi.fn(async () => {
      return JSON.stringify({ invalid: 'data' })
    })

    const { runDiagnosis } = await import('../pipeline')
    await collectEvents(runDiagnosis(testFormData, mockStore, mockLLM))

    // 1 initial + 5 retries = 6 max calls
    // But circuit breaker (3 consecutive failures) may trip first
    // Either way, should NOT exceed 6 calls
    expect(vi.mocked(mockLLM).mock.calls.length).toBeLessThanOrEqual(6)
  })

  it('emits scan_error (not infinite loop) when every attempt fails', async () => {
    const mockLLM: LLMClient = vi.fn(async () => {
      throw new Error('Persistent failure')
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Pipeline terminated
    const errorEvent = events.find((e) => e.type === 'scan_error')
    expect(errorEvent).toBeDefined()

    // No scan_complete
    expect(events.find((e) => e.type === 'scan_complete')).toBeUndefined()

    // Store updated to failed
    expect(mockStore.updateScanStatus).toHaveBeenCalledWith(
      expect.any(String),
      'failed',
      expect.any(String),
    )
  })
})
