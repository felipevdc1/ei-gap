// ---------------------------------------------------------------------------
// EI-GAP — POST /api/lead — Lead Capture Route
// Story E2.S5 — API routes com SSE streaming
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { leadSchema } from '@/lib/validators/form-validators'
import { store } from '@/lib/store'

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  // 1. Parse request body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  // 2. Validate with Zod
  const validation = leadSchema.safeParse(rawBody)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400 },
    )
  }

  // 3. Save lead to store
  try {
    await store.saveLead({
      email: validation.data.email,
      name: validation.data.name,
      company: validation.data.company,
      scan_id: validation.data.scan_id,
      lgpd_consent: validation.data.lgpd_consent as boolean,
      lgpd_consent_at: validation.data.lgpd_consent_at,
    })

    return NextResponse.json(
      { success: true },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save lead', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
