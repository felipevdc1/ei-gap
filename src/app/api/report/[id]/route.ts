// ---------------------------------------------------------------------------
// EI-GAP — GET /api/report/[id] — Report Retrieval Route
// Story E2.S5 — API routes com SSE streaming
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params

  // Validate id parameter
  if (!id || id.trim() === '') {
    return NextResponse.json(
      { error: 'Report ID is required' },
      { status: 400 },
    )
  }

  // Try to get the report directly
  const report = await store.getReport(id)

  if (report) {
    return NextResponse.json(report, { status: 200 })
  }

  // Report not found — check if there's a scan still processing
  const scan = await store.getScan(id)

  if (scan && scan.status === 'processing') {
    return NextResponse.json(
      { status: 'processing', message: 'Scan is still in progress' },
      { status: 202 },
    )
  }

  // Neither report nor processing scan found
  return NextResponse.json(
    { error: 'Report not found' },
    { status: 404 },
  )
}
