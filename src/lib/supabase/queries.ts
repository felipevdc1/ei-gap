// ---------------------------------------------------------------------------
// EI-GAP — Supabase Query Functions
// Raw Supabase operations wrapped in typed functions.
// ---------------------------------------------------------------------------
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ScanReport, ScanStatus } from '@/types/scanner'
import type {
  SaveScanData,
  StoredScan,
  StoredReport,
  SaveLeadData,
} from '@/lib/store/interface'

// ---------------------------------------------------------------------------
// Scans
// ---------------------------------------------------------------------------

export async function saveScan(
  client: SupabaseClient,
  id: string,
  data: SaveScanData
): Promise<void> {
  const { error } = await client.from('scans').insert({
    id,
    sector: data.sector,
    company_name: data.company_name,
    company_size: data.company_size,
    form_data: data.form_data,
    status: data.status,
    ip_hash: data.ip_hash,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getScan(
  client: SupabaseClient,
  id: string
): Promise<StoredScan | null> {
  const { data, error } = await client
    .from('scans')
    .select('id, sector, company_name, form_data, status, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    id: data.id,
    sector: data.sector,
    company_name: data.company_name,
    form_data: data.form_data,
    status: data.status as ScanStatus,
    created_at: new Date(data.created_at),
  }
}

export async function updateScanStatus(
  client: SupabaseClient,
  id: string,
  status: ScanStatus,
  error?: string
): Promise<void> {
  const updateData: Record<string, unknown> = { status }
  if (error !== undefined) {
    updateData.error = error
  }

  const { error: dbError } = await client
    .from('scans')
    .update(updateData)
    .eq('id', id)

  if (dbError) {
    throw new Error(dbError.message)
  }
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function saveReport(
  client: SupabaseClient,
  id: string,
  scanId: string,
  content: ScanReport
): Promise<void> {
  const { error } = await client.from('reports').insert({
    id,
    scan_id: scanId,
    content,
    status: 'completed',
    total_roi_min: content.total_roi_min,
    total_roi_max: content.total_roi_max,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function getReport(
  client: SupabaseClient,
  id: string
): Promise<StoredReport | null> {
  const { data, error } = await client
    .from('reports')
    .select('id, scan_id, content, status, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) return null

  return {
    id: data.id,
    scan_id: data.scan_id,
    content: data.content,
    status: data.status,
    created_at: new Date(data.created_at),
  }
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function saveLead(
  client: SupabaseClient,
  data: SaveLeadData
): Promise<void> {
  const { error } = await client.from('leads').insert({
    scan_id: data.scan_id,
    email: data.email,
    name: data.name,
    company: data.company,
    lgpd_consent: data.lgpd_consent,
    lgpd_consent_at: data.lgpd_consent_at,
  })

  if (error) {
    throw new Error(error.message)
  }
}
