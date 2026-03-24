// ---------------------------------------------------------------------------
// EI-GAP — In-Memory ScanStore Implementation
// ---------------------------------------------------------------------------
import type { ScanReport, ScanStatus } from '@/types/scanner'
import type {
  ScanStore,
  SaveScanData,
  StoredScan,
  StoredReport,
  SaveLeadData,
} from './interface'

/** Internal envelope that wraps stored data with a timestamp for TTL checks */
interface Envelope<T> {
  data: T
  storedAt: number // Date.now() at insertion time
}

export interface MemoryStoreOptions {
  /** Time-to-live in milliseconds. Default: 1 hour (3_600_000). */
  ttlMs?: number
}

const DEFAULT_TTL_MS = 3_600_000 // 1 hour

/**
 * In-memory implementation of ScanStore using `Map`.
 *
 * - Lazy TTL eviction: expired items are removed on `get()`.
 * - Suitable for serverless cold-start scenarios where data is ephemeral.
 */
export class MemoryStore implements ScanStore {
  private readonly ttlMs: number
  private readonly scans = new Map<string, Envelope<InternalScan>>()
  private readonly reports = new Map<string, Envelope<InternalReport>>()
  private readonly leads = new Map<string, Envelope<InternalLead>>()

  constructor(options?: MemoryStoreOptions) {
    this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS
  }

  // -------------------------------------------------------------------------
  // Scans
  // -------------------------------------------------------------------------

  async saveScan(id: string, data: SaveScanData): Promise<void> {
    const internal: InternalScan = {
      id,
      sector: data.sector,
      company_name: data.company_name,
      company_size: data.company_size,
      form_data: data.form_data,
      status: data.status,
      ip_hash: data.ip_hash,
      error: undefined,
      created_at: new Date(),
    }
    this.scans.set(id, this.wrap(internal))
  }

  async getScan(id: string): Promise<StoredScan | null> {
    const envelope = this.scans.get(id)
    if (!envelope) return null

    if (this.isExpired(envelope)) {
      this.scans.delete(id)
      return null
    }

    const d = envelope.data
    return {
      id: d.id,
      sector: d.sector,
      company_name: d.company_name,
      form_data: d.form_data,
      status: d.status,
      created_at: d.created_at,
    }
  }

  async updateScanStatus(
    id: string,
    status: ScanStatus,
    error?: string
  ): Promise<void> {
    const envelope = this.scans.get(id)
    if (!envelope) {
      throw new Error(`Scan not found: ${id}`)
    }
    envelope.data.status = status
    if (error !== undefined) {
      envelope.data.error = error
    }
  }

  // -------------------------------------------------------------------------
  // Reports
  // -------------------------------------------------------------------------

  async saveReport(
    id: string,
    scanId: string,
    content: ScanReport
  ): Promise<void> {
    const internal: InternalReport = {
      id,
      scan_id: scanId,
      content,
      status: 'completed',
      created_at: new Date(),
    }
    this.reports.set(id, this.wrap(internal))
  }

  async getReport(id: string): Promise<StoredReport | null> {
    const envelope = this.reports.get(id)
    if (!envelope) return null

    if (this.isExpired(envelope)) {
      this.reports.delete(id)
      return null
    }

    const d = envelope.data
    return {
      id: d.id,
      scan_id: d.scan_id,
      content: d.content,
      status: d.status,
      created_at: d.created_at,
    }
  }

  // -------------------------------------------------------------------------
  // Leads
  // -------------------------------------------------------------------------

  async saveLead(data: SaveLeadData): Promise<void> {
    const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const internal: InternalLead = {
      id,
      scan_id: data.scan_id,
      email: data.email,
      name: data.name,
      company: data.company,
      lgpd_consent: data.lgpd_consent,
      lgpd_consent_at: data.lgpd_consent_at,
      created_at: new Date(),
    }
    this.leads.set(id, this.wrap(internal))
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private wrap<T>(data: T): Envelope<T> {
    return { data, storedAt: Date.now() }
  }

  private isExpired<T>(envelope: Envelope<T>): boolean {
    return Date.now() - envelope.storedAt >= this.ttlMs
  }
}

// ---------------------------------------------------------------------------
// Internal types (not exported — only the interface types are public)
// ---------------------------------------------------------------------------

interface InternalScan {
  id: string
  sector: string
  company_name?: string
  company_size?: string
  form_data: SaveScanData['form_data']
  status: ScanStatus
  ip_hash?: string
  error?: string
  created_at: Date
}

interface InternalReport {
  id: string
  scan_id: string
  content: ScanReport
  status: string
  created_at: Date
}

interface InternalLead {
  id: string
  scan_id: string
  email: string
  name?: string
  company?: string
  lgpd_consent: boolean
  lgpd_consent_at: string
  created_at: Date
}
