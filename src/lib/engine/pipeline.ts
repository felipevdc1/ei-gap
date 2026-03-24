// ---------------------------------------------------------------------------
// EI-GAP AI Scanner — Pipeline Orchestrator (5 sequential LLM calls)
// ---------------------------------------------------------------------------

import { nanoid } from 'nanoid'
import type { z } from 'zod'

import type {
  PhaseEvent,
  ScanFormData,
  ScanReport,
} from '@/types/scanner'
import type { ScanStore } from '@/lib/store/interface'
import {
  businessProfileSchema,
  processMapSchema,
  scoredOpportunitiesSchema,
  rankedOpportunitiesSchema,
} from '@/lib/validators/form-validators'
import {
  getIntakePrompt,
  getIntakePromptFreeText,
  getExtractionPrompt,
  getScoringPrompt,
  getRankingPrompt,
  getReportPrompt,
} from '@/lib/openrouter/prompts'
import { getConfig } from '@/lib/config'

// ---------------------------------------------------------------------------
// LLMClient interface — injectable for testing
// ---------------------------------------------------------------------------

export type LLMClient = (
  systemPrompt: string,
  userMessage: string,
  options?: { model?: string; timeoutMs?: number },
) => Promise<string | null>

// ---------------------------------------------------------------------------
// Resilience constants
// ---------------------------------------------------------------------------

/** Total pipeline timeout in milliseconds (120 seconds) */
const PIPELINE_TIMEOUT_MS = 120_000

/** Circuit breaker threshold — consecutive LLM call failures before abort */
const CIRCUIT_BREAKER_THRESHOLD = 3

/** Exponential backoff base delay in milliseconds */
const BACKOFF_BASE_DELAY_MS = 1_000

/** Exponential backoff max delay in milliseconds */
const BACKOFF_MAX_DELAY_MS = 10_000

// ---------------------------------------------------------------------------
// Phase definitions
// ---------------------------------------------------------------------------

interface PhaseDefinition {
  name: string
  phase: number
  getSystemPrompt: (sector: string) => string
  schema: z.ZodType | null // null = report (final phase, no intermediate validation)
  buildUserMessage: (formData: ScanFormData, previousOutput: unknown) => string
}

const PHASES: PhaseDefinition[] = [
  {
    name: 'intake',
    phase: 1,
    getSystemPrompt: (sector) => getIntakePrompt(sector),
    schema: businessProfileSchema,
    buildUserMessage: (formData) =>
      `Analyze this business data:\n\n${JSON.stringify(formData, null, 2)}`,
  },
  {
    name: 'extraction',
    phase: 2,
    getSystemPrompt: (sector) => getExtractionPrompt(sector),
    schema: processMapSchema,
    buildUserMessage: (_formData, previousOutput) =>
      `Given the BUSINESS_PROFILE from the intake phase:\n\n${JSON.stringify(previousOutput, null, 2)}\n\nExtract a detailed PROCESS_MAP.`,
  },
  {
    name: 'scoring',
    phase: 3,
    getSystemPrompt: () => getScoringPrompt(),
    schema: scoredOpportunitiesSchema,
    buildUserMessage: (_formData, previousOutput) =>
      `Given the PROCESS_MAP:\n\n${JSON.stringify(previousOutput, null, 2)}\n\nScore each opportunity using the 4D Scoring Engine.`,
  },
  {
    name: 'ranking',
    phase: 4,
    getSystemPrompt: () => getRankingPrompt(),
    schema: rankedOpportunitiesSchema,
    buildUserMessage: (_formData, previousOutput) =>
      `Given the SCORED_OPPORTUNITIES:\n\n${JSON.stringify(previousOutput, null, 2)}\n\nRank and enrich each opportunity.`,
  },
  {
    name: 'report',
    phase: 5,
    getSystemPrompt: () => getReportPrompt(),
    schema: null, // Final output — no intermediate validation
    buildUserMessage: (formData, previousOutput) =>
      `Given the RANKED_OPPORTUNITIES and business context:\n\nBusiness: ${formData.company_name} (${formData.sector})\n\n${JSON.stringify(previousOutput, null, 2)}\n\nAssemble the final diagnostic report.`,
  },
]

// ---------------------------------------------------------------------------
// JSON extraction helper
// ---------------------------------------------------------------------------

/**
 * Attempts to extract a JSON object from an LLM response string.
 * Handles cases where the LLM wraps JSON in markdown code blocks.
 */
function extractJSON(raw: string): unknown {
  // Try direct parse first
  const trimmed = raw.trim()

  // Try stripping markdown code fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim())
  }

  return JSON.parse(trimmed)
}

// ---------------------------------------------------------------------------
// Resilience helpers
// ---------------------------------------------------------------------------

/**
 * Extracts HTTP status code from an error, if present.
 */
function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as { status: number }).status
  }
  return undefined
}

/**
 * Returns true if the error is eligible for fallback model retry.
 * Eligible errors: 429 (rate limit), 500 (server error), model-related errors.
 */
function isEligibleForFallback(error: unknown): boolean {
  const status = getErrorStatus(error)
  if (status === 429 || status === 500) return true
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('model') || msg.includes('rate limit')) return true
  }
  return false
}

/**
 * Returns true if the error is a 429 rate limit error.
 */
function isRateLimitError(error: unknown): boolean {
  const status = getErrorStatus(error)
  if (status === 429) return true
  if (error instanceof Error && error.message.toLowerCase().includes('rate limit')) return true
  return false
}

/**
 * Computes exponential backoff delay with jitter.
 * delay = min(baseDelay * 2^attempt + random_jitter, maxDelay)
 */
function computeBackoffDelay(attempt: number): number {
  const exponentialDelay = BACKOFF_BASE_DELAY_MS * Math.pow(2, attempt)
  const jitter = Math.random() * BACKOFF_BASE_DELAY_MS
  return Math.min(exponentialDelay + jitter, BACKOFF_MAX_DELAY_MS)
}

/**
 * Sleeps for a given duration in milliseconds. Works with both real and fake timers.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Pipeline orchestrator
// ---------------------------------------------------------------------------

/**
 * Runs the full 5-phase AI diagnosis pipeline as an async generator.
 *
 * Resilience features:
 * - Total pipeline timeout: 120s (aborts if exceeded, emits scan_error)
 * - Max retries per phase: configurable via OPENROUTER_MAX_RETRIES (default 3)
 * - Circuit breaker: 3 consecutive LLM call failures → abort with clear error
 * - Fallback model: if primary fails with 429/500 → try OPENROUTER_FALLBACK_MODEL
 * - Exponential backoff with jitter on 429 rate limit errors
 *
 * Each phase:
 * 1. Emits `phase_start`
 * 2. Calls LLM with system prompt + user message
 * 3. Parses JSON from response
 * 4. Validates with Zod schema (if applicable)
 * 5. On validation failure: emits `phase_retry`, re-runs with correction hint
 * 6. After max retries: emits `scan_error`
 * 7. On success: emits `phase_complete`
 *
 * At end: emits `scan_complete` with reportId
 */
export async function* runDiagnosis(
  formData: ScanFormData,
  store: ScanStore,
  llmClient?: LLMClient,
): AsyncGenerator<PhaseEvent> {
  const config = getConfig()
  const maxRetries = config.openrouter.maxRetries
  const fallbackModel = config.openrouter.fallbackModel
  const scanId = nanoid()
  const reportId = nanoid()

  // Resolve LLM client — use injected mock or default chatCompletion
  const llm: LLMClient = llmClient ?? (await getDefaultLLMClient())

  // Save scan to store
  await store.saveScan(scanId, {
    sector: formData.sector,
    company_name: formData.company_name,
    form_data: formData,
    status: 'processing',
  })

  // Total pipeline timeout tracking
  const pipelineStartTime = Date.now()

  // Circuit breaker state — consecutive LLM call failures across all phases
  let consecutiveFailures = 0

  let previousOutput: unknown = null

  for (const phaseDef of PHASES) {
    // Check total pipeline timeout before starting a new phase
    if (Date.now() - pipelineStartTime >= PIPELINE_TIMEOUT_MS) {
      const errorMsg = `Pipeline timeout: total execution exceeded ${PIPELINE_TIMEOUT_MS / 1000}s`
      await store.updateScanStatus(scanId, 'failed', errorMsg)
      yield {
        type: 'scan_error',
        phase: phaseDef.phase,
        name: phaseDef.name,
        error: errorMsg,
      }
      return
    }

    const startTime = Date.now()

    // Emit phase_start
    yield {
      type: 'phase_start',
      phase: phaseDef.phase,
      name: phaseDef.name,
    }

    let phaseResult: unknown = null
    let succeeded = false
    let lastError = ''
    let useFallback = false

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Check circuit breaker
      if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        const errorMsg = `Pipeline aborted: circuit breaker tripped after ${CIRCUIT_BREAKER_THRESHOLD} consecutive LLM call failures`
        await store.updateScanStatus(scanId, 'failed', errorMsg)
        yield {
          type: 'scan_error',
          phase: phaseDef.phase,
          name: phaseDef.name,
          error: errorMsg,
        }
        return
      }

      // Check total pipeline timeout before each attempt
      if (Date.now() - pipelineStartTime >= PIPELINE_TIMEOUT_MS) {
        const errorMsg = `Pipeline timeout: total execution exceeded ${PIPELINE_TIMEOUT_MS / 1000}s`
        await store.updateScanStatus(scanId, 'failed', errorMsg)
        yield {
          type: 'scan_error',
          phase: phaseDef.phase,
          name: phaseDef.name,
          error: errorMsg,
        }
        return
      }

      try {
        // Build messages
        const systemPrompt = phaseDef.getSystemPrompt(formData.sector)
        let userMessage = phaseDef.buildUserMessage(formData, previousOutput)

        // Add correction hint on retries
        if (attempt > 0) {
          userMessage += '\n\nIMPORTANT: Your previous response was invalid. Please return valid JSON matching the required schema. Ensure all required fields are present and values are within allowed ranges.'
        }

        // Determine model to use: fallback if flagged and available
        const modelOverride = useFallback && fallbackModel ? fallbackModel : undefined

        // Call LLM
        const response = await llm(systemPrompt, userMessage, modelOverride ? { model: modelOverride } : undefined)

        // Handle null response
        if (response === null) {
          lastError = 'LLM returned null response'
          consecutiveFailures++
          useFallback = false // null response is not model-specific
          if (attempt < maxRetries) {
            yield {
              type: 'phase_retry',
              phase: phaseDef.phase,
              name: phaseDef.name,
              attempt: attempt + 1,
              reason: lastError,
            }
          }
          continue
        }

        // Parse JSON
        const parsed = extractJSON(response)

        // Validate with Zod (if schema exists)
        if (phaseDef.schema) {
          const result = phaseDef.schema.safeParse(parsed)
          if (!result.success) {
            lastError = `Zod validation failed: ${result.error.message}`
            // Validation failure is NOT an LLM call failure — don't increment circuit breaker
            useFallback = false
            if (attempt < maxRetries) {
              yield {
                type: 'phase_retry',
                phase: phaseDef.phase,
                name: phaseDef.name,
                attempt: attempt + 1,
                reason: lastError,
              }
            }
            continue
          }
          phaseResult = result.data
        } else {
          // No schema validation (report phase)
          phaseResult = parsed
        }

        // Success — reset circuit breaker
        consecutiveFailures = 0
        useFallback = false
        succeeded = true
        break
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        lastError = errorMessage

        // Increment circuit breaker counter
        consecutiveFailures++

        // Determine if we should try fallback model on next attempt
        useFallback = isEligibleForFallback(error) && !!fallbackModel

        // Apply exponential backoff with jitter on rate limit errors
        if (isRateLimitError(error) && attempt < maxRetries) {
          const delay = computeBackoffDelay(attempt)
          await sleep(delay)
        }

        if (attempt < maxRetries) {
          yield {
            type: 'phase_retry',
            phase: phaseDef.phase,
            name: phaseDef.name,
            attempt: attempt + 1,
            reason: errorMessage,
          }
        }
      }
    }

    if (!succeeded) {
      // Check if circuit breaker tripped
      if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        const errorMsg = `Pipeline aborted: circuit breaker tripped after ${CIRCUIT_BREAKER_THRESHOLD} consecutive LLM call failures`
        await store.updateScanStatus(scanId, 'failed', errorMsg)
        yield {
          type: 'scan_error',
          phase: phaseDef.phase,
          name: phaseDef.name,
          error: errorMsg,
        }
        return
      }

      // Max retries exhausted — emit error and update store
      const errorMsg = `Phase ${phaseDef.name} failed after ${maxRetries} retries: ${lastError}`
      await store.updateScanStatus(scanId, 'failed', errorMsg)

      yield {
        type: 'scan_error',
        phase: phaseDef.phase,
        name: phaseDef.name,
        error: errorMsg,
      }
      return
    }

    const durationMs = Date.now() - startTime

    // Emit phase_complete
    yield {
      type: 'phase_complete',
      phase: phaseDef.phase,
      name: phaseDef.name,
      duration_ms: durationMs,
    }

    // Chain output to next phase
    previousOutput = phaseResult
  }

  // All phases completed — save report and update status
  await store.saveReport(reportId, scanId, previousOutput as ScanReport)
  await store.updateScanStatus(scanId, 'completed')

  yield {
    type: 'scan_complete',
    phase: 5,
    name: 'report',
    reportId,
  }
}

// ---------------------------------------------------------------------------
// Free-text pipeline orchestrator
// ---------------------------------------------------------------------------

/**
 * Phase definitions for the free-text pipeline.
 * Identical to PHASES except Call 1 uses getIntakePromptFreeText and
 * receives the raw user text instead of structured form data.
 */
const FREE_TEXT_PHASES: PhaseDefinition[] = [
  {
    name: 'intake',
    phase: 1,
    getSystemPrompt: () => getIntakePromptFreeText(),
    schema: businessProfileSchema,
    buildUserMessage: (formData) =>
      `Analyze this free-text business description and extract a structured business profile:\n\n${(formData as unknown as { __freeText: string }).__freeText}`,
  },
  // Phases 2-5 are identical to the structured pipeline
  ...PHASES.slice(1),
]

/**
 * Runs the full 5-phase AI diagnosis pipeline from a free-text description.
 *
 * This is a thin wrapper that reuses the same pipeline infrastructure as
 * runDiagnosis, but swaps Call 1 to use the free-text intake prompt.
 * Calls 2-5 work identically — they receive the same BusinessProfile output.
 *
 * Resilience features are identical to runDiagnosis (timeout, retries,
 * circuit breaker, fallback model, exponential backoff).
 */
export async function* runFreeTextDiagnosis(
  text: string,
  store: ScanStore,
  llmClient?: LLMClient,
): AsyncGenerator<PhaseEvent> {
  const config = getConfig()
  const maxRetries = config.openrouter.maxRetries
  const fallbackModel = config.openrouter.fallbackModel
  const scanId = nanoid()
  const reportId = nanoid()

  // Resolve LLM client
  const llm: LLMClient = llmClient ?? (await getDefaultLLMClient())

  // Build a synthetic ScanFormData-like object to pass through the pipeline.
  // The free-text phases use __freeText for Call 1, while Calls 2-5 use
  // company_name and sector from the Call 1 output.
  const syntheticFormData = {
    sector: 'generic',
    company_name: 'Empresa (texto livre)',
    company_size: '1-10' as const,
    tech_maturity: 'low' as const,
    current_tools: undefined,
    sector_answers: {},
    processes: [],
    __freeText: text,
  } as ScanFormData & { __freeText: string }

  // Save scan to store
  await store.saveScan(scanId, {
    sector: 'generic',
    company_name: 'Empresa (texto livre)',
    form_data: syntheticFormData,
    status: 'processing',
  })

  // Total pipeline timeout tracking
  const pipelineStartTime = Date.now()

  // Circuit breaker state
  let consecutiveFailures = 0

  let previousOutput: unknown = null

  for (const phaseDef of FREE_TEXT_PHASES) {
    // Check total pipeline timeout
    if (Date.now() - pipelineStartTime >= PIPELINE_TIMEOUT_MS) {
      const errorMsg = `Pipeline timeout: total execution exceeded ${PIPELINE_TIMEOUT_MS / 1000}s`
      await store.updateScanStatus(scanId, 'failed', errorMsg)
      yield { type: 'scan_error', phase: phaseDef.phase, name: phaseDef.name, error: errorMsg }
      return
    }

    const startTime = Date.now()

    yield { type: 'phase_start', phase: phaseDef.phase, name: phaseDef.name }

    let phaseResult: unknown = null
    let succeeded = false
    let lastError = ''
    let useFallback = false

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        const errorMsg = `Pipeline aborted: circuit breaker tripped after ${CIRCUIT_BREAKER_THRESHOLD} consecutive LLM call failures`
        await store.updateScanStatus(scanId, 'failed', errorMsg)
        yield { type: 'scan_error', phase: phaseDef.phase, name: phaseDef.name, error: errorMsg }
        return
      }

      if (Date.now() - pipelineStartTime >= PIPELINE_TIMEOUT_MS) {
        const errorMsg = `Pipeline timeout: total execution exceeded ${PIPELINE_TIMEOUT_MS / 1000}s`
        await store.updateScanStatus(scanId, 'failed', errorMsg)
        yield { type: 'scan_error', phase: phaseDef.phase, name: phaseDef.name, error: errorMsg }
        return
      }

      try {
        // For the report phase (Call 5), use data from Call 1 output if available
        const sectorForPrompt =
          previousOutput && typeof previousOutput === 'object' && 'detected_sector' in (previousOutput as Record<string, unknown>)
            ? String((previousOutput as Record<string, unknown>).detected_sector)
            : syntheticFormData.sector

        const systemPrompt = phaseDef.getSystemPrompt(sectorForPrompt)
        let userMessage = phaseDef.buildUserMessage(syntheticFormData, previousOutput)

        if (attempt > 0) {
          userMessage += '\n\nIMPORTANT: Your previous response was invalid. Please return valid JSON matching the required schema. Ensure all required fields are present and values are within allowed ranges.'
        }

        const modelOverride = useFallback && fallbackModel ? fallbackModel : undefined
        const response = await llm(systemPrompt, userMessage, modelOverride ? { model: modelOverride } : undefined)

        if (response === null) {
          lastError = 'LLM returned null response'
          consecutiveFailures++
          useFallback = false
          if (attempt < maxRetries) {
            yield { type: 'phase_retry', phase: phaseDef.phase, name: phaseDef.name, attempt: attempt + 1, reason: lastError }
          }
          continue
        }

        const parsed = extractJSON(response)

        if (phaseDef.schema) {
          const result = phaseDef.schema.safeParse(parsed)
          if (!result.success) {
            lastError = `Zod validation failed: ${result.error.message}`
            useFallback = false
            if (attempt < maxRetries) {
              yield { type: 'phase_retry', phase: phaseDef.phase, name: phaseDef.name, attempt: attempt + 1, reason: lastError }
            }
            continue
          }
          phaseResult = result.data
        } else {
          phaseResult = parsed
        }

        consecutiveFailures = 0
        useFallback = false
        succeeded = true
        break
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        lastError = errorMessage
        consecutiveFailures++
        useFallback = isEligibleForFallback(error) && !!fallbackModel

        if (isRateLimitError(error) && attempt < maxRetries) {
          const delay = computeBackoffDelay(attempt)
          await sleep(delay)
        }

        if (attempt < maxRetries) {
          yield { type: 'phase_retry', phase: phaseDef.phase, name: phaseDef.name, attempt: attempt + 1, reason: errorMessage }
        }
      }
    }

    if (!succeeded) {
      if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        const errorMsg = `Pipeline aborted: circuit breaker tripped after ${CIRCUIT_BREAKER_THRESHOLD} consecutive LLM call failures`
        await store.updateScanStatus(scanId, 'failed', errorMsg)
        yield { type: 'scan_error', phase: phaseDef.phase, name: phaseDef.name, error: errorMsg }
        return
      }

      const errorMsg = `Phase ${phaseDef.name} failed after ${maxRetries} retries: ${lastError}`
      await store.updateScanStatus(scanId, 'failed', errorMsg)
      yield { type: 'scan_error', phase: phaseDef.phase, name: phaseDef.name, error: errorMsg }
      return
    }

    const durationMs = Date.now() - startTime
    yield { type: 'phase_complete', phase: phaseDef.phase, name: phaseDef.name, duration_ms: durationMs }

    // After Call 1: update the scan with detected sector/company name
    if (phaseDef.phase === 1 && phaseResult && typeof phaseResult === 'object') {
      const profile = phaseResult as Record<string, unknown>
      if (profile.detected_sector) {
        syntheticFormData.sector = String(profile.detected_sector)
      }
      if (profile.company_name) {
        syntheticFormData.company_name = String(profile.company_name)
      }
    }

    previousOutput = phaseResult
  }

  // All phases completed
  await store.saveReport(reportId, scanId, previousOutput as ScanReport)
  await store.updateScanStatus(scanId, 'completed')

  yield { type: 'scan_complete', phase: 5, name: 'report', reportId }
}

// ---------------------------------------------------------------------------
// Default LLM client loader (lazy import to avoid circular deps)
// ---------------------------------------------------------------------------

async function getDefaultLLMClient(): Promise<LLMClient> {
  const { chatCompletion } = await import('@/lib/openrouter/client')
  return chatCompletion
}
