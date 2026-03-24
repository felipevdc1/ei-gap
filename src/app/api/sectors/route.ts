// ---------------------------------------------------------------------------
// EI-GAP — GET /api/sectors — Sector List Route
// Story E2.S5 — API routes com SSE streaming
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { getSectorProfiles } from '@/lib/data/loader'

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(_request: Request): Promise<Response> {
  try {
    const profiles = getSectorProfiles()

    const sectors = profiles.sectors.map((s) => ({
      slug: s.slug,
      name: s.name,
    }))

    return NextResponse.json({ sectors }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load sectors', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
