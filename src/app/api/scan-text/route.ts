// ---------------------------------------------------------------------------
// EI-GAP — POST /api/scan-text — SSE Streaming Free-Text Scan Route
// ---------------------------------------------------------------------------

// Vercel serverless function timeout: 120s for the AI pipeline (5 LLM calls)
export const maxDuration = 120

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { runFreeTextDiagnosis } from '@/lib/engine/pipeline'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { store } from '@/lib/store'
import { getConfig } from '@/lib/config'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const freeTextSchema = z.object({
  text: z
    .string()
    .min(50, 'Texto deve ter no mínimo 50 caracteres')
    .max(5000, 'Texto deve ter no máximo 5000 caracteres'),
})

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

/** Regex to match ASCII control characters (0x00-0x1F) except \n (0x0A) and \t (0x09) */
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g

/** Prompt injection patterns to neutralize */
const INJECTION_PATTERNS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  { pattern: /ignore\s+(all\s+)?previous\s+(instructions|prompts)/gi, replacement: '[filtered]' },
  { pattern: /\bsystem:/gi, replacement: '[filtered]:' },
  { pattern: /\bassistant:/gi, replacement: '[filtered]:' },
]

function sanitizeFreeText(text: string): string {
  let result = text.replace(CONTROL_CHARS_RE, '')
  for (const { pattern, replacement } of INJECTION_PATTERNS) {
    result = result.replace(pattern, replacement)
  }
  return `<user_input>${result}</user_input>`
}

// ---------------------------------------------------------------------------
// IP hashing — never store raw IPs
// ---------------------------------------------------------------------------

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + '__ei-gap-salt__')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // 1. Extract and hash IP
  const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipHash = await hashIP(rawIp)

  // 2. Rate limit check (same config as /api/scan)
  const config = getConfig()
  const rateLimitResult = checkRateLimit(ipHash, { limit: config.rateLimit.perIp })
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult)

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: rateLimitHeaders,
      },
    )
  }

  // 3. Parse and validate request body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: rateLimitHeaders },
    )
  }

  const validation = freeTextSchema.safeParse(rawBody)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400, headers: rateLimitHeaders },
    )
  }

  // 4. Sanitize input
  const sanitizedText = sanitizeFreeText(validation.data.text)

  // 5. Create SSE stream from pipeline async generator
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = runFreeTextDiagnosis(sanitizedText, store)

        for await (const event of generator) {
          const ssePayload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(ssePayload))
        }
      } catch (error) {
        const errorPayload = `event: scan_error\ndata: ${JSON.stringify({
          type: 'scan_error',
          phase: 0,
          name: 'stream',
          error: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`
        controller.enqueue(encoder.encode(errorPayload))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...rateLimitHeaders,
    },
  })
}
