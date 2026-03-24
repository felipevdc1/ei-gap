// ---------------------------------------------------------------------------
// EI-GAP — PostgreSQL ScanStore Implementation
// ---------------------------------------------------------------------------
import { Pool } from 'pg'
import type { ScanReport, ScanStatus } from '@/types/scanner'
import type {
  ScanStore,
  SaveScanData,
  StoredScan,
  StoredReport,
  SaveLeadData,
} from './interface'

/**
 * PostgreSQL-backed implementation of ScanStore using `pg` Pool.
 *
 * Designed for self-hosted Docker deployments with vanilla PostgreSQL
 * (no Supabase dependency).
 */
export class PostgresStore implements ScanStore {
  private readonly pool: Pool

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl })

    // Graceful shutdown: close pool when process exits
    const shutdown = () => {
      this.pool.end().catch(() => {})
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  }

  /** Expose pool for health checks */
  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  // -------------------------------------------------------------------------
  // Scans
  // -------------------------------------------------------------------------

  async saveScan(id: string, data: SaveScanData): Promise<void> {
    await this.pool.query(
      `INSERT INTO scans (id, sector, company_name, company_size, form_data, status, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        data.sector,
        data.company_name ?? null,
        data.company_size ?? null,
        JSON.stringify(data.form_data),
        data.status,
        data.ip_hash ?? null,
      ]
    )
  }

  async getScan(id: string): Promise<StoredScan | null> {
    const result = await this.pool.query(
      `SELECT id, sector, company_name, form_data, status, created_at
       FROM scans WHERE id = $1`,
      [id]
    )
    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      sector: row.sector,
      company_name: row.company_name ?? undefined,
      form_data: row.form_data,
      status: row.status as ScanStatus,
      created_at: new Date(row.created_at),
    }
  }

  async updateScanStatus(
    id: string,
    status: ScanStatus,
    error?: string
  ): Promise<void> {
    const result = await this.pool.query(
      `UPDATE scans SET status = $1, error = $2 WHERE id = $3`,
      [status, error ? JSON.stringify(error) : null, id]
    )
    if (result.rowCount === 0) {
      throw new Error(`Scan not found: ${id}`)
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
    await this.pool.query(
      `INSERT INTO reports (id, scan_id, content, status)
       VALUES ($1, $2, $3, 'completed')`,
      [id, scanId, JSON.stringify(content)]
    )
  }

  async getReport(id: string): Promise<StoredReport | null> {
    const result = await this.pool.query(
      `SELECT id, scan_id, content, status, created_at
       FROM reports WHERE id = $1`,
      [id]
    )
    if (result.rows.length === 0) return null

    const row = result.rows[0]
    return {
      id: row.id,
      scan_id: row.scan_id,
      content: row.content,
      status: row.status,
      created_at: new Date(row.created_at),
    }
  }

  // -------------------------------------------------------------------------
  // Leads
  // -------------------------------------------------------------------------

  async saveLead(data: SaveLeadData): Promise<void> {
    await this.pool.query(
      `INSERT INTO leads (scan_id, email, name, company, lgpd_consent, lgpd_consent_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.scan_id,
        data.email,
        data.name ?? null,
        data.company ?? null,
        data.lgpd_consent,
        data.lgpd_consent_at,
      ]
    )
  }
}
