// ---------------------------------------------------------------------------
// EI-GAP — ScanStore Factory & Re-exports
// ---------------------------------------------------------------------------
export type {
  ScanStore,
  SaveScanData,
  StoredScan,
  StoredReport,
  SaveLeadData,
} from './interface'
export { MemoryStore } from './memory'
export type { MemoryStoreOptions } from './memory'
export { SupabaseStore } from './supabase'
export { PostgresStore } from './postgres'

import { MemoryStore } from './memory'
import { SupabaseStore } from './supabase'
import { PostgresStore } from './postgres'
import type { ScanStore } from './interface'

/**
 * Returns the appropriate ScanStore implementation.
 *
 * Priority:
 * 1. DATABASE_URL present → PostgresStore (Docker / self-hosted)
 * 2. Supabase env vars present → SupabaseStore
 * 3. Otherwise → MemoryStore (default / development)
 */
function createStore(): ScanStore {
  const hasDatabaseUrl =
    typeof process !== 'undefined' && process.env.DATABASE_URL

  if (hasDatabaseUrl) {
    return new PostgresStore(process.env.DATABASE_URL!)
  }

  const hasSupabase =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (hasSupabase) {
    return new SupabaseStore()
  }

  return new MemoryStore()
}

/** Singleton store instance for the current runtime */
export const store: ScanStore = createStore()
