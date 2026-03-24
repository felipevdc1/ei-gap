// ---------------------------------------------------------------------------
// EI-GAP — Health Check Endpoint
// ---------------------------------------------------------------------------
import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { PostgresStore } from '@/lib/store/postgres'

export const dynamic = 'force-dynamic'

export async function GET() {
  const health: Record<string, unknown> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }

  // If using PostgresStore, check DB connectivity
  if (store instanceof PostgresStore) {
    const dbOk = await store.ping()
    health.database = dbOk ? 'connected' : 'unreachable'
    if (!dbOk) {
      health.status = 'degraded'
      return NextResponse.json(health, { status: 503 })
    }
  }

  return NextResponse.json(health, { status: 200 })
}
