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

import { MemoryStore } from './memory'
import { SupabaseStore } from './supabase'
import type { ScanStore } from './interface'

/**
 * Returns the appropriate ScanStore implementation.
 *
 * - When Supabase env vars are present → SupabaseStore
 * - Otherwise → MemoryStore (default)
 */
function createStore(): ScanStore {
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
