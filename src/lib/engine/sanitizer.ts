// ---------------------------------------------------------------------------
// EI-GAP AI Scanner — Input Sanitizer (Prompt Injection Defense)
// ---------------------------------------------------------------------------

import type { ScanFormData } from '@/types/scanner'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_NAME_LENGTH = 200
const MAX_TEXTAREA_LENGTH = 500

/** Fields that use the shorter (name) limit */
const NAME_FIELDS: ReadonlySet<string> = new Set([
  'sector',
  'company_name',
])

/** Regex to match ASCII control characters (0x00-0x1F) except \n (0x0A) and \t (0x09) */
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g

/** Prompt injection patterns to neutralize */
const INJECTION_PATTERNS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  { pattern: /ignore\s+(all\s+)?previous\s+(instructions|prompts)/gi, replacement: '[filtered]' },
  { pattern: /\bsystem:/gi, replacement: '[filtered]:' },
  { pattern: /\bassistant:/gi, replacement: '[filtered]:' },
]

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Remove control characters, keeping newline and tab */
function removeControlChars(value: string): string {
  return value.replace(CONTROL_CHARS_RE, '')
}

/** Neutralize known prompt injection payloads */
function neutralizeInjections(value: string): string {
  let result = value
  for (const { pattern, replacement } of INJECTION_PATTERNS) {
    result = result.replace(pattern, replacement)
  }
  return result
}

/** Truncate a string to the given max length */
function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}

/** Wrap a string in <user_input> delimiters */
function wrapDelimiters(value: string): string {
  return `<user_input>${value}</user_input>`
}

/**
 * Full sanitization pipeline for a single string field.
 * Order: control chars -> injection neutralization -> truncation -> delimiters
 */
function sanitizeString(value: string, maxLength: number): string {
  let result = removeControlChars(value)
  result = neutralizeInjections(result)
  result = truncate(result, maxLength)
  return wrapDelimiters(result)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sanitize all user-provided string fields in a `ScanFormData` object.
 *
 * - Removes ASCII control characters (except \\n, \\t)
 * - Neutralizes common prompt injection payloads
 * - Truncates fields to safe limits (200 for names, 500 for textareas)
 * - Wraps every string value in `<user_input>...</user_input>` delimiters
 *
 * Returns a **new** object — the original input is never mutated.
 */
export function sanitizeFormData(formData: ScanFormData): ScanFormData {
  const sanitized: ScanFormData = {
    ...formData,
    // Name-length fields
    sector: sanitizeString(formData.sector, MAX_NAME_LENGTH),
    company_name: sanitizeString(formData.company_name, MAX_NAME_LENGTH),

    // Enum-like fields pass through unchanged
    company_size: formData.company_size,
    tech_maturity: formData.tech_maturity,

    // Textarea-length optional field
    current_tools: formData.current_tools !== undefined
      ? sanitizeString(formData.current_tools, MAX_TEXTAREA_LENGTH)
      : undefined,

    // Sanitize each sector answer value
    sector_answers: Object.fromEntries(
      Object.entries(formData.sector_answers).map(([key, value]) => [
        key,
        sanitizeString(value, MAX_TEXTAREA_LENGTH),
      ]),
    ),

    // Sanitize each process name; preserve numeric fields
    processes: formData.processes.map((process) => ({
      ...process,
      name: sanitizeString(process.name, MAX_NAME_LENGTH),
    })),
  }

  return sanitized
}
