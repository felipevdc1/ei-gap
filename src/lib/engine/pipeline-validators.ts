// ---------------------------------------------------------------------------
// EI-GAP AI Scanner — Pipeline Semantic Validators (Post-LLM)
// ---------------------------------------------------------------------------
// These validators add SEMANTIC business rules on top of Zod structural
// validation. Each function corresponds to a pipeline phase output.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface BarrierResult {
  passed: boolean
  violations: string[]
}

// ---------------------------------------------------------------------------
// Strategic Barrier — Forbidden terms regex (case-insensitive)
// ---------------------------------------------------------------------------

const FORBIDDEN_TERMS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /passo a passo/i, label: 'passo a passo' },
  { pattern: /implementação:/i, label: 'implementação:' },
  { pattern: /\bconfigurar\b/i, label: 'configurar' },
  { pattern: /\bsetup\b/i, label: 'setup' },
  { pattern: /\bcronjob\b/i, label: 'cronjob' },
  { pattern: /\bapi key\b/i, label: 'api key' },
  { pattern: /\bcódigo\b/i, label: 'código' },
  { pattern: /\bdeploy\b/i, label: 'deploy' },
]

/** Pattern to detect generic process names like "Process 1", "Processo 2" */
const GENERIC_NAME_RE = /^process[oa]?\s*\d+$/i

// ---------------------------------------------------------------------------
// Call 1: Intake Output Validator
// ---------------------------------------------------------------------------

/**
 * Validates the semantic quality of Call 1 (Intake / Business Profile) output.
 * Rejects if:
 * - key_processes has fewer than 5 entries
 * - detected_sector is missing or empty
 */
export function validateIntakeOutput(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  const keyProcesses = data.key_processes
  if (!Array.isArray(keyProcesses) || keyProcesses.length < 5) {
    errors.push(
      `Intake must identify at least 5 key processes/fields, got ${Array.isArray(keyProcesses) ? keyProcesses.length : 0}`,
    )
  }

  const detectedSector = data.detected_sector
  if (!detectedSector || (typeof detectedSector === 'string' && detectedSector.trim() === '')) {
    errors.push('Sector not identified: detected_sector is missing or empty')
  }

  return { valid: errors.length === 0, errors }
}

// ---------------------------------------------------------------------------
// Call 2: Extraction Output Validator
// ---------------------------------------------------------------------------

/**
 * Validates the semantic quality of Call 2 (Extraction / Process Map) output.
 * Rejects if:
 * - Fewer than 5 processes mapped
 * - Processes have generic names (e.g., "Process 1")
 * - No Pareto analysis (no process with automation_potential >= 0.8)
 */
export function validateExtractionOutput(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  const processes = (data as { processes?: unknown[] }).processes
  if (!Array.isArray(processes)) {
    errors.push('Extraction output must contain a processes array')
    return { valid: false, errors }
  }

  if (processes.length < 5) {
    errors.push(`Extraction must map at least 5 processes, got ${processes.length}`)
  }

  const genericCount = processes.filter(
    (p) => {
      const rec = p as Record<string, unknown>
      return typeof rec.name === 'string' && GENERIC_NAME_RE.test(rec.name.trim())
    },
  ).length
  if (genericCount > 0) {
    errors.push(
      `Found ${genericCount} generic process name(s). Processes must have specific, descriptive names.`,
    )
  }

  const hasPareto = processes.some(
    (p) => {
      const rec = p as Record<string, unknown>
      return typeof rec.automation_potential === 'number' && rec.automation_potential >= 0.8
    },
  )
  if (!hasPareto) {
    errors.push(
      'No Pareto analysis detected: at least one process must have automation_potential >= 0.8',
    )
  }

  return { valid: errors.length === 0, errors }
}

// ---------------------------------------------------------------------------
// Call 3: Scoring Output Validator
// ---------------------------------------------------------------------------

/**
 * Validates the semantic quality of Call 3 (Scoring) output.
 * Rejects if:
 * - All composite_scores are identical (no fixed criteria differentiation)
 * - Any opportunity has empty guardrails array
 */
export function validateScoringOutput(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  const opportunities = (data as { opportunities?: unknown[] }).opportunities
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    errors.push('Scoring output must contain a non-empty opportunities array')
    return { valid: false, errors }
  }

  // Check fixed criteria — composite scores must not all be identical
  const compositeScores = new Set(
    opportunities.map((o) => (o as Record<string, unknown>).composite_score),
  )
  if (compositeScores.size === 1 && opportunities.length > 1) {
    errors.push(
      'All composite_scores are identical — scoring criteria must differentiate opportunities',
    )
  }

  // Check guardrails — every opportunity must have at least one
  const missingGuardrails = opportunities.filter(
    (o) => {
      const rec = o as Record<string, unknown>
      return !Array.isArray(rec.guardrails) || rec.guardrails.length === 0
    },
  )
  if (missingGuardrails.length > 0) {
    errors.push(
      `${missingGuardrails.length} opportunity(ies) missing guardrails. Every opportunity must have at least one guardrail.`,
    )
  }

  return { valid: errors.length === 0, errors }
}

// ---------------------------------------------------------------------------
// Call 4: Ranking Output Validator
// ---------------------------------------------------------------------------

/**
 * Validates the semantic quality of Call 4 (Ranking) output.
 * Rejects if:
 * - All opportunities have roi_range_min=0 AND roi_range_max=0 (no ROI)
 * - All opportunities have loss_per_month=0 (no loss aversion)
 */
export function validateRankingOutput(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  const opportunities = (data as { opportunities?: unknown[] }).opportunities
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    errors.push('Ranking output must contain a non-empty opportunities array')
    return { valid: false, errors }
  }

  const hasROI = opportunities.some(
    (o) => {
      const rec = o as Record<string, unknown>
      return (typeof rec.roi_range_min === 'number' && rec.roi_range_min > 0) ||
        (typeof rec.roi_range_max === 'number' && rec.roi_range_max > 0)
    },
  )
  if (!hasROI) {
    errors.push(
      'No ROI data found: at least one opportunity must have roi_range_min or roi_range_max > 0',
    )
  }

  const hasLoss = opportunities.some(
    (o) => {
      const rec = o as Record<string, unknown>
      return typeof rec.loss_per_month === 'number' && rec.loss_per_month !== 0
    },
  )
  if (!hasLoss) {
    errors.push(
      'No loss aversion data: at least one opportunity must have loss_per_month != 0',
    )
  }

  return { valid: errors.length === 0, errors }
}

// ---------------------------------------------------------------------------
// Call 5: Report Output Validator
// ---------------------------------------------------------------------------

/**
 * Validates the semantic quality of Call 5 (Report) output.
 * Rejects if:
 * - Text contains implementation details (strategic barrier violation)
 * - Missing CTA (call-to-action)
 */
export function validateReportOutput(data: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  // Check CTA presence
  const cta = data.cta
  if (!cta || (typeof cta === 'string' && cta.trim() === '')) {
    errors.push('Report must include a CTA (call-to-action)')
  }

  // Check strategic barrier on all text fields
  const textFields = [
    'executive_summary',
    'gains_summary',
    'losses_summary',
    'cta',
  ] as const

  for (const field of textFields) {
    const value = data[field]
    if (typeof value === 'string') {
      const barrier = checkStrategicBarrier(value)
      if (!barrier.passed) {
        errors.push(
          `Strategic barrier violation in "${field}": forbidden terms [${barrier.violations.join(', ')}]`,
        )
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

// ---------------------------------------------------------------------------
// Strategic Barrier — checks text for forbidden implementation terms
// ---------------------------------------------------------------------------

/**
 * Checks if the given text contains any forbidden implementation-detail terms.
 * Returns { passed: true } if clean, or { passed: false, violations } with
 * the list of detected forbidden terms.
 *
 * Regex is case-insensitive.
 */
export function checkStrategicBarrier(text: string): BarrierResult {
  const violations: string[] = []

  for (const { pattern, label } of FORBIDDEN_TERMS) {
    if (pattern.test(text)) {
      violations.push(label)
    }
  }

  return { passed: violations.length === 0, violations }
}

// ---------------------------------------------------------------------------
// Strip Leaked Sections — fallback after max retries
// ---------------------------------------------------------------------------

/**
 * Removes entire paragraphs (double-newline separated) that contain any
 * forbidden term. Used as a last-resort fallback when the strategic barrier
 * fails after max retries.
 *
 * Preserves paragraph structure of the remaining clean text.
 */
export function stripLeakedSections(text: string): string {
  const paragraphs = text.split('\n\n')

  const clean = paragraphs.filter((paragraph) => {
    for (const { pattern } of FORBIDDEN_TERMS) {
      if (pattern.test(paragraph)) {
        return false
      }
    }
    return true
  })

  return clean.join('\n\n')
}
