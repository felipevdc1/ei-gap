// ---------------------------------------------------------------------------
// EI-GAP — ScanStore Interface (Adapter Pattern)
// ---------------------------------------------------------------------------
import type { ScanFormData, ScanReport, ScanStatus } from '@/types/scanner'

/** Data required to persist a new scan */
export interface SaveScanData {
  sector: string
  company_name?: string
  company_size?: string
  form_data: ScanFormData
  status: ScanStatus
  ip_hash?: string
}

/** Shape returned when retrieving a scan */
export interface StoredScan {
  id: string
  sector: string
  company_name?: string
  form_data: ScanFormData
  status: ScanStatus
  created_at: Date
}

/** Shape returned when retrieving a report */
export interface StoredReport {
  id: string
  scan_id: string
  content: ScanReport
  status: string
  created_at: Date
}

/** Data required to persist a lead */
export interface SaveLeadData {
  scan_id: string
  email: string
  name?: string
  company?: string
  lgpd_consent: boolean
  lgpd_consent_at: string
}

/**
 * ScanStore — abstract contract for scan persistence.
 *
 * Implementations: MemoryStore (default), SupabaseStore (future E5).
 */
export interface ScanStore {
  saveScan(id: string, data: SaveScanData): Promise<void>
  getScan(id: string): Promise<StoredScan | null>
  updateScanStatus(id: string, status: ScanStatus, error?: string): Promise<void>
  saveReport(id: string, scanId: string, content: ScanReport): Promise<void>
  getReport(id: string): Promise<StoredReport | null>
  saveLead(data: SaveLeadData): Promise<void>
}
