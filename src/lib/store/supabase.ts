// ---------------------------------------------------------------------------
// EI-GAP — Supabase ScanStore Implementation
// ---------------------------------------------------------------------------
import type { ScanReport, ScanStatus } from '@/types/scanner'
import type {
  ScanStore,
  SaveScanData,
  StoredScan,
  StoredReport,
  SaveLeadData,
} from './interface'
import { createClient } from '@/lib/supabase/server'
import * as queries from '@/lib/supabase/queries'

/**
 * Supabase-backed implementation of ScanStore.
 *
 * Uses the server-side Supabase client from `@/lib/supabase/server`.
 * Each method call creates/reuses the Supabase client and delegates
 * to the raw query functions in `@/lib/supabase/queries`.
 */
export class SupabaseStore implements ScanStore {
  private async client() {
    return createClient()
  }

  async saveScan(id: string, data: SaveScanData): Promise<void> {
    const client = await this.client()
    await queries.saveScan(client, id, data)
  }

  async getScan(id: string): Promise<StoredScan | null> {
    const client = await this.client()
    return queries.getScan(client, id)
  }

  async updateScanStatus(
    id: string,
    status: ScanStatus,
    error?: string
  ): Promise<void> {
    const client = await this.client()
    await queries.updateScanStatus(client, id, status, error)
  }

  async saveReport(
    id: string,
    scanId: string,
    content: ScanReport
  ): Promise<void> {
    const client = await this.client()
    await queries.saveReport(client, id, scanId, content)
  }

  async getReport(id: string): Promise<StoredReport | null> {
    const client = await this.client()
    return queries.getReport(client, id)
  }

  async saveLead(data: SaveLeadData): Promise<void> {
    const client = await this.client()
    await queries.saveLead(client, data)
  }
}
