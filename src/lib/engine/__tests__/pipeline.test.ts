import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PhaseEvent, ScanFormData } from '@/types/scanner'
import type { ScanStore } from '@/lib/store/interface'
import type { LLMClient } from '../pipeline'

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
    {
      name: 'invoice_processing',
      category: 'finance',
      time_per_week: 15,
      pain_level: 5,
      automation_potential: 0.9,
      opportunities: ['ocr_extraction', 'auto_matching'],
    },
    {
      name: 'lead_qualification',
      category: 'sales',
      time_per_week: 10,
      pain_level: 3,
      automation_potential: 0.7,
      opportunities: ['scoring_model', 'auto_enrichment'],
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
    {
      name: 'Customer Support Chatbot',
      description: 'AI-powered initial customer inquiry routing and resolution',
      category: 'operations',
      impact_score: 8,
      feasibility_score: 7,
      effort_score: 5,
      roi_score: 8,
      composite_score: 7.15,
      guardrails: ['human_escalation', 'confidence_threshold'],
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
    {
      name: 'Customer Support Chatbot',
      description: 'AI-powered initial customer inquiry routing and resolution',
      category: 'operations',
      impact_score: 8,
      feasibility_score: 7,
      effort_score: 5,
      roi_score: 8,
      composite_score: 7.15,
      guardrails: ['human_escalation', 'confidence_threshold'],
      rank: 2,
      roi_range_min: 30000,
      roi_range_max: 80000,
      loss_per_month: 5000,
      time_to_value: '4-8 weeks',
      quick_win: false,
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

// ---------------------------------------------------------------------------
// Phase response map — maps phase index to valid fixture JSON
// ---------------------------------------------------------------------------

const phaseResponses: Record<number, object> = {
  0: validBusinessProfile,
  1: validProcessMap,
  2: validScoredOpportunities,
  3: validRankedOpportunities,
  4: validScanReport,
}

// ---------------------------------------------------------------------------
// Test form data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Mock store
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helper: collect all events from async generator
// ---------------------------------------------------------------------------

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
// Tests
// ---------------------------------------------------------------------------

describe('engine/pipeline — runDiagnosis', () => {
  let mockStore: ScanStore

  beforeEach(() => {
    mockStore = createMockStore()
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    vi.stubEnv('OPENROUTER_MODEL', 'test-model')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ei-gap.test')
    vi.stubEnv('NEXT_PUBLIC_CTA_URL', 'https://ei-gap.test/cta')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // -------------------------------------------------------------------------
  // Happy path — complete pipeline
  // -------------------------------------------------------------------------

  it('executes all 5 phases and emits correct events in order', async () => {
    let callIndex = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      const response = phaseResponses[callIndex]
      callIndex++
      return JSON.stringify(response)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Should have: 5x phase_start + 5x phase_complete + 1x scan_complete = 11 events
    expect(events).toHaveLength(11)

    // Verify event order
    const eventTypes = events.map((e) => e.type)
    expect(eventTypes).toEqual([
      'phase_start',    // phase 1: intake
      'phase_complete', // phase 1
      'phase_start',    // phase 2: extraction
      'phase_complete', // phase 2
      'phase_start',    // phase 3: scoring
      'phase_complete', // phase 3
      'phase_start',    // phase 4: ranking
      'phase_complete', // phase 4
      'phase_start',    // phase 5: report
      'phase_complete', // phase 5
      'scan_complete',  // done
    ])

    // Verify phase numbers
    const phaseNumbers = events.map((e) => e.phase)
    expect(phaseNumbers).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5])

    // LLM called exactly 5 times
    expect(mockLLM).toHaveBeenCalledTimes(5)
  })

  it('emits phase names matching the pipeline architecture', async () => {
    let callIndex = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      const response = phaseResponses[callIndex]
      callIndex++
      return JSON.stringify(response)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const phaseStartEvents = events.filter((e) => e.type === 'phase_start')
    const names = phaseStartEvents.map((e) => e.name)
    expect(names).toEqual(['intake', 'extraction', 'scoring', 'ranking', 'report'])
  })

  it('emits scan_complete with a reportId', async () => {
    let callIndex = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      const response = phaseResponses[callIndex]
      callIndex++
      return JSON.stringify(response)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const scanComplete = events.find((e) => e.type === 'scan_complete')
    expect(scanComplete).toBeDefined()
    expect(scanComplete!.reportId).toBeDefined()
    expect(scanComplete!.reportId!.length).toBeGreaterThan(0)
  })

  it('emits duration_ms on phase_complete events', async () => {
    let callIndex = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      const response = phaseResponses[callIndex]
      callIndex++
      return JSON.stringify(response)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const completeEvents = events.filter((e) => e.type === 'phase_complete')
    for (const event of completeEvents) {
      expect(event.duration_ms).toBeDefined()
      expect(typeof event.duration_ms).toBe('number')
      expect(event.duration_ms!).toBeGreaterThanOrEqual(0)
    }
  })

  // -------------------------------------------------------------------------
  // Store interactions
  // -------------------------------------------------------------------------

  it('saves scan to store at start with status "processing"', async () => {
    let callIndex = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      const response = phaseResponses[callIndex]
      callIndex++
      return JSON.stringify(response)
    })

    const { runDiagnosis } = await import('../pipeline')
    await collectEvents(runDiagnosis(testFormData, mockStore, mockLLM))

    expect(mockStore.saveScan).toHaveBeenCalledTimes(1)
    const [scanId, scanData] = (mockStore.saveScan as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(typeof scanId).toBe('string')
    expect(scanData.status).toBe('processing')
    expect(scanData.sector).toBe('technology')
    expect(scanData.form_data).toEqual(testFormData)
  })

  it('saves report and updates scan status to "completed" on success', async () => {
    let callIndex = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      const response = phaseResponses[callIndex]
      callIndex++
      return JSON.stringify(response)
    })

    const { runDiagnosis } = await import('../pipeline')
    await collectEvents(runDiagnosis(testFormData, mockStore, mockLLM))

    expect(mockStore.saveReport).toHaveBeenCalledTimes(1)
    expect(mockStore.updateScanStatus).toHaveBeenCalledWith(
      expect.any(String),
      'completed',
    )
  })

  // -------------------------------------------------------------------------
  // Veto / retry
  // -------------------------------------------------------------------------

  it('retries when Zod validation fails, emitting phase_retry', async () => {
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      // First call returns invalid data (missing required fields)
      if (callCount === 1) {
        return JSON.stringify({ invalid: 'data' })
      }
      // Second call (retry) returns valid data for intake
      if (callCount === 2) {
        return JSON.stringify(validBusinessProfile)
      }
      // Remaining calls return valid data for subsequent phases
      const phaseIndex = callCount - 2 // offset by 1 extra call for the retry
      return JSON.stringify(phaseResponses[phaseIndex])
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Should have a retry event
    const retryEvents = events.filter((e) => e.type === 'phase_retry')
    expect(retryEvents.length).toBeGreaterThanOrEqual(1)
    expect(retryEvents[0].phase).toBe(1)
    expect(retryEvents[0].attempt).toBeDefined()
    expect(retryEvents[0].reason).toBeDefined()

    // Pipeline should still complete successfully
    const scanComplete = events.find((e) => e.type === 'scan_complete')
    expect(scanComplete).toBeDefined()
  })

  it('retries when JSON parse fails, emitting phase_retry', async () => {
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      // First call returns non-JSON
      if (callCount === 1) {
        return 'This is not valid JSON at all'
      }
      // Second call returns valid intake data
      if (callCount === 2) {
        return JSON.stringify(validBusinessProfile)
      }
      // Remaining phases
      const phaseIndex = callCount - 2
      return JSON.stringify(phaseResponses[phaseIndex])
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const retryEvents = events.filter((e) => e.type === 'phase_retry')
    expect(retryEvents.length).toBeGreaterThanOrEqual(1)

    // Pipeline should still complete
    const scanComplete = events.find((e) => e.type === 'scan_complete')
    expect(scanComplete).toBeDefined()
  })

  it('emits scan_error after max retries exceeded', async () => {
    // Always return invalid data — should exhaust all retries
    const mockLLM: LLMClient = vi.fn(async () => {
      return JSON.stringify({ invalid: 'data' })
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Should have phase_start, then multiple phase_retry, then scan_error
    const errorEvent = events.find((e) => e.type === 'scan_error')
    expect(errorEvent).toBeDefined()
    expect(errorEvent!.error).toBeDefined()

    // Should NOT have scan_complete
    const completeEvent = events.find((e) => e.type === 'scan_complete')
    expect(completeEvent).toBeUndefined()

    // Store should be updated to "failed"
    expect(mockStore.updateScanStatus).toHaveBeenCalledWith(
      expect.any(String),
      'failed',
      expect.any(String),
    )
  })

  it('retries up to configured max (default 3) before failing', async () => {
    const mockLLM: LLMClient = vi.fn(async () => {
      return JSON.stringify({ invalid: 'data' })
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const retryEvents = events.filter((e) => e.type === 'phase_retry')
    // Default max retries is 3, so we should see exactly 3 retry events
    expect(retryEvents.length).toBe(3)

    // Total LLM calls = 1 initial + 3 retries = 4
    expect(mockLLM).toHaveBeenCalledTimes(4)
  })

  // -------------------------------------------------------------------------
  // LLM returns null
  // -------------------------------------------------------------------------

  it('treats LLM returning null as a veto condition and retries', async () => {
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      if (callCount === 1) return null
      if (callCount === 2) return JSON.stringify(validBusinessProfile)
      const phaseIndex = callCount - 2
      return JSON.stringify(phaseResponses[phaseIndex])
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const retryEvents = events.filter((e) => e.type === 'phase_retry')
    expect(retryEvents.length).toBeGreaterThanOrEqual(1)

    const scanComplete = events.find((e) => e.type === 'scan_complete')
    expect(scanComplete).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // Contract tests — each phase validates with Zod
  // -------------------------------------------------------------------------

  it('validates intake output with businessProfileSchema', async () => {
    // Return data that passes JSON.parse but fails businessProfileSchema
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      if (callCount === 1) {
        // Valid JSON but missing required fields for BusinessProfile
        return JSON.stringify({ company_name: 'Test' }) // missing sector, etc.
      }
      if (callCount === 2) {
        return JSON.stringify(validBusinessProfile)
      }
      const phaseIndex = callCount - 2
      return JSON.stringify(phaseResponses[phaseIndex])
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    // Should retry once then succeed
    const retryEvents = events.filter(
      (e) => e.type === 'phase_retry' && e.phase === 1,
    )
    expect(retryEvents.length).toBe(1)
  })

  it('validates extraction output with processMapSchema', async () => {
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      // Phase 1 (intake) — valid
      if (callCount === 1) return JSON.stringify(validBusinessProfile)
      // Phase 2 (extraction) — first attempt invalid
      if (callCount === 2) return JSON.stringify({ processes: [] }) // min 1
      // Phase 2 retry — valid
      if (callCount === 3) return JSON.stringify(validProcessMap)
      // Remaining phases
      const phaseIndex = callCount - 2 // offset for retry
      return JSON.stringify(phaseResponses[phaseIndex])
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const retryEvents = events.filter(
      (e) => e.type === 'phase_retry' && e.phase === 2,
    )
    expect(retryEvents.length).toBe(1)
  })

  it('validates scoring output with scoredOpportunitiesSchema', async () => {
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      if (callCount === 1) return JSON.stringify(validBusinessProfile)
      if (callCount === 2) return JSON.stringify(validProcessMap)
      // Phase 3 first attempt — invalid (impact_score out of range)
      if (callCount === 3) {
        return JSON.stringify({
          opportunities: [{
            name: 'test',
            description: 'test',
            category: 'test',
            impact_score: 99, // invalid: max 10
            feasibility_score: 8,
            effort_score: 4,
            roi_score: 9,
            composite_score: 7.85,
            guardrails: [],
          }],
        })
      }
      // Phase 3 retry — valid
      if (callCount === 4) return JSON.stringify(validScoredOpportunities)
      // Remaining phases
      if (callCount === 5) return JSON.stringify(validRankedOpportunities)
      return JSON.stringify(validScanReport)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const retryEvents = events.filter(
      (e) => e.type === 'phase_retry' && e.phase === 3,
    )
    expect(retryEvents.length).toBe(1)
  })

  it('validates ranking output with rankedOpportunitiesSchema', async () => {
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      if (callCount === 1) return JSON.stringify(validBusinessProfile)
      if (callCount === 2) return JSON.stringify(validProcessMap)
      if (callCount === 3) return JSON.stringify(validScoredOpportunities)
      // Phase 4 first attempt — invalid (missing rank field)
      if (callCount === 4) {
        return JSON.stringify({
          opportunities: [{
            ...validScoredOpportunities.opportunities[0],
            // missing: rank, roi_range_min, roi_range_max, etc.
          }],
        })
      }
      // Phase 4 retry — valid
      if (callCount === 5) return JSON.stringify(validRankedOpportunities)
      // Phase 5
      return JSON.stringify(validScanReport)
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const retryEvents = events.filter(
      (e) => e.type === 'phase_retry' && e.phase === 4,
    )
    expect(retryEvents.length).toBe(1)
  })

  // -------------------------------------------------------------------------
  // Retry prompt adjustment
  // -------------------------------------------------------------------------

  it('adds schema correction hint to retry prompts', async () => {
    const calls: Array<{ system: string; user: string }> = []
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async (system, user) => {
      calls.push({ system, user })
      callCount++
      if (callCount === 1) return JSON.stringify({ invalid: 'data' })
      if (callCount === 2) return JSON.stringify(validBusinessProfile)
      const phaseIndex = callCount - 2
      return JSON.stringify(phaseResponses[phaseIndex])
    })

    const { runDiagnosis } = await import('../pipeline')
    await collectEvents(runDiagnosis(testFormData, mockStore, mockLLM))

    // The retry call (index 1) should have the correction hint in the user message
    expect(calls[1].user).toContain('valid JSON')
  })

  // -------------------------------------------------------------------------
  // LLM client exception
  // -------------------------------------------------------------------------

  it('treats LLM client exception as a veto condition and retries', async () => {
    let callCount = 0
    const mockLLM: LLMClient = vi.fn(async () => {
      callCount++
      if (callCount === 1) throw new Error('Network error')
      if (callCount === 2) return JSON.stringify(validBusinessProfile)
      const phaseIndex = callCount - 2
      return JSON.stringify(phaseResponses[phaseIndex])
    })

    const { runDiagnosis } = await import('../pipeline')
    const events = await collectEvents(
      runDiagnosis(testFormData, mockStore, mockLLM),
    )

    const retryEvents = events.filter((e) => e.type === 'phase_retry')
    expect(retryEvents.length).toBeGreaterThanOrEqual(1)

    const scanComplete = events.find((e) => e.type === 'scan_complete')
    expect(scanComplete).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // Output chaining — each phase receives previous phase's output
  // -------------------------------------------------------------------------

  it('passes previous phase output as context to next phase', async () => {
    const calls: Array<{ system: string; user: string }> = []
    let callIndex = 0
    const mockLLM: LLMClient = vi.fn(async (system, user) => {
      calls.push({ system, user })
      const response = phaseResponses[callIndex]
      callIndex++
      return JSON.stringify(response)
    })

    const { runDiagnosis } = await import('../pipeline')
    await collectEvents(runDiagnosis(testFormData, mockStore, mockLLM))

    // Call 2 (extraction) should receive the business profile in user message
    expect(calls[1].user).toContain('TechCorp Solutions')

    // Call 3 (scoring) should receive the process map in user message
    expect(calls[2].user).toContain('customer_support')

    // Call 4 (ranking) should receive scored opportunities in user message
    expect(calls[3].user).toContain('OCR Invoice Extraction')

    // Call 5 (report) should receive ranked opportunities in user message
    expect(calls[4].user).toContain('OCR Invoice Extraction')
  })
})
