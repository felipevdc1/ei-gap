// ---------------------------------------------------------------------------
// EI-GAP — ScanStore In-Memory Implementation Tests (TDD — RED phase)
// ---------------------------------------------------------------------------
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { ScanFormData, ScanReport, ScanStatus } from '@/types/scanner'
import type { ScanStore } from '../interface'
import { MemoryStore } from '../memory'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeScanFormData = (overrides: Partial<ScanFormData> = {}): ScanFormData => ({
  sector: 'tech',
  company_name: 'Acme Corp',
  company_size: '11-50',
  tech_maturity: 'medium',
  sector_answers: { q1: 'a1' },
  processes: [{ name: 'onboarding', time_per_week: 5, pain_level: 3 }],
  ...overrides,
})

const makeScanReport = (overrides: Partial<ScanReport> = {}): ScanReport => ({
  id: 'report-1',
  scan_id: 'scan-1',
  executive_summary: 'Summary',
  opportunities: [],
  total_roi_min: 1000,
  total_roi_max: 5000,
  cost_of_inaction_monthly: 200,
  gains_summary: 'Gains',
  losses_summary: 'Losses',
  sector: 'tech',
  company_name: 'Acme Corp',
  created_at: new Date().toISOString(),
  ...overrides,
})

// ---------------------------------------------------------------------------
// Interface contract tests
// ---------------------------------------------------------------------------

describe('ScanStore interface contract', () => {
  let store: ScanStore

  beforeEach(() => {
    store = new MemoryStore()
  })

  it('has saveScan method', () => {
    expect(typeof store.saveScan).toBe('function')
  })

  it('has getScan method', () => {
    expect(typeof store.getScan).toBe('function')
  })

  it('has updateScanStatus method', () => {
    expect(typeof store.updateScanStatus).toBe('function')
  })

  it('has saveReport method', () => {
    expect(typeof store.saveReport).toBe('function')
  })

  it('has getReport method', () => {
    expect(typeof store.getReport).toBe('function')
  })

  it('has saveLead method', () => {
    expect(typeof store.saveLead).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// CRUD tests — Scans
// ---------------------------------------------------------------------------

describe('MemoryStore — Scan CRUD', () => {
  let store: MemoryStore

  beforeEach(() => {
    store = new MemoryStore()
  })

  it('saves and retrieves a scan', async () => {
    const formData = makeScanFormData()

    await store.saveScan('scan-1', {
      sector: 'tech',
      company_name: 'Acme Corp',
      company_size: '11-50',
      form_data: formData,
      status: 'pending' as ScanStatus,
      ip_hash: 'abc123',
    })

    const result = await store.getScan('scan-1')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('scan-1')
    expect(result!.sector).toBe('tech')
    expect(result!.company_name).toBe('Acme Corp')
    expect(result!.form_data).toEqual(formData)
    expect(result!.status).toBe('pending')
    expect(result!.created_at).toBeInstanceOf(Date)
  })

  it('returns null for non-existent scan', async () => {
    const result = await store.getScan('does-not-exist')
    expect(result).toBeNull()
  })

  it('updates scan status', async () => {
    const formData = makeScanFormData()

    await store.saveScan('scan-1', {
      sector: 'tech',
      form_data: formData,
      status: 'pending' as ScanStatus,
    })

    await store.updateScanStatus('scan-1', 'processing')
    const result = await store.getScan('scan-1')
    expect(result!.status).toBe('processing')
  })

  it('updates scan status with error message', async () => {
    const formData = makeScanFormData()

    await store.saveScan('scan-1', {
      sector: 'tech',
      form_data: formData,
      status: 'processing' as ScanStatus,
    })

    await store.updateScanStatus('scan-1', 'failed', 'AI provider timeout')
    const result = await store.getScan('scan-1')
    expect(result!.status).toBe('failed')
  })

  it('throws when updating status of non-existent scan', async () => {
    await expect(
      store.updateScanStatus('ghost', 'completed')
    ).rejects.toThrow()
  })

  it('saves scan without optional fields', async () => {
    const formData = makeScanFormData()

    await store.saveScan('scan-2', {
      sector: 'finance',
      form_data: formData,
      status: 'pending' as ScanStatus,
    })

    const result = await store.getScan('scan-2')
    expect(result).not.toBeNull()
    expect(result!.company_name).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// CRUD tests — Reports
// ---------------------------------------------------------------------------

describe('MemoryStore — Report CRUD', () => {
  let store: MemoryStore

  beforeEach(() => {
    store = new MemoryStore()
  })

  it('saves and retrieves a report', async () => {
    const report = makeScanReport()

    await store.saveReport('report-1', 'scan-1', report)
    const result = await store.getReport('report-1')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('report-1')
    expect(result!.scan_id).toBe('scan-1')
    expect(result!.content).toEqual(report)
    expect(result!.status).toBe('completed')
    expect(result!.created_at).toBeInstanceOf(Date)
  })

  it('returns null for non-existent report', async () => {
    const result = await store.getReport('ghost')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// CRUD tests — Leads
// ---------------------------------------------------------------------------

describe('MemoryStore — Lead CRUD', () => {
  let store: MemoryStore

  beforeEach(() => {
    store = new MemoryStore()
  })

  it('saves a lead without throwing', async () => {
    await expect(
      store.saveLead({
        scan_id: 'scan-1',
        email: 'user@example.com',
        name: 'John',
        company: 'Acme',
        lgpd_consent: true,
        lgpd_consent_at: '2026-01-01T00:00:00.000Z',
      })
    ).resolves.not.toThrow()
  })

  it('saves a lead with only required fields', async () => {
    await expect(
      store.saveLead({
        scan_id: 'scan-1',
        email: 'user@example.com',
        lgpd_consent: true,
        lgpd_consent_at: '2026-01-01T00:00:00.000Z',
      })
    ).resolves.not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// TTL tests (fake timers)
// ---------------------------------------------------------------------------

describe('MemoryStore — TTL expiration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns scan before TTL expires', async () => {
    const store = new MemoryStore({ ttlMs: 3600000 }) // 1 hour
    const formData = makeScanFormData()

    await store.saveScan('scan-1', {
      sector: 'tech',
      form_data: formData,
      status: 'pending' as ScanStatus,
    })

    // Advance 59 minutes
    vi.advanceTimersByTime(59 * 60 * 1000)

    const result = await store.getScan('scan-1')
    expect(result).not.toBeNull()
  })

  it('returns null for scan after TTL expires (lazy eviction)', async () => {
    const store = new MemoryStore({ ttlMs: 3600000 }) // 1 hour
    const formData = makeScanFormData()

    await store.saveScan('scan-1', {
      sector: 'tech',
      form_data: formData,
      status: 'pending' as ScanStatus,
    })

    // Advance past 1 hour
    vi.advanceTimersByTime(3600001)

    const result = await store.getScan('scan-1')
    expect(result).toBeNull()
  })

  it('returns null for report after TTL expires', async () => {
    const store = new MemoryStore({ ttlMs: 3600000 })
    const report = makeScanReport()

    await store.saveReport('report-1', 'scan-1', report)

    vi.advanceTimersByTime(3600001)

    const result = await store.getReport('report-1')
    expect(result).toBeNull()
  })

  it('respects custom TTL value', async () => {
    const store = new MemoryStore({ ttlMs: 5000 }) // 5 seconds
    const formData = makeScanFormData()

    await store.saveScan('scan-1', {
      sector: 'tech',
      form_data: formData,
      status: 'pending' as ScanStatus,
    })

    vi.advanceTimersByTime(4999)
    expect(await store.getScan('scan-1')).not.toBeNull()

    vi.advanceTimersByTime(2)
    expect(await store.getScan('scan-1')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Complete lifecycle test (save -> get -> update -> get -> expire)
// ---------------------------------------------------------------------------

describe('MemoryStore — Full lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('scan lifecycle: save -> get -> update -> get -> expire', async () => {
    const store = new MemoryStore({ ttlMs: 3600000 })
    const formData = makeScanFormData()

    // 1. Save
    await store.saveScan('scan-1', {
      sector: 'tech',
      company_name: 'Acme',
      form_data: formData,
      status: 'pending' as ScanStatus,
    })

    // 2. Get
    const saved = await store.getScan('scan-1')
    expect(saved).not.toBeNull()
    expect(saved!.status).toBe('pending')

    // 3. Update
    await store.updateScanStatus('scan-1', 'processing')

    // 4. Get again
    const updated = await store.getScan('scan-1')
    expect(updated!.status).toBe('processing')

    // 5. Complete
    await store.updateScanStatus('scan-1', 'completed')
    const completed = await store.getScan('scan-1')
    expect(completed!.status).toBe('completed')

    // 6. Expire
    vi.advanceTimersByTime(3600001)
    const expired = await store.getScan('scan-1')
    expect(expired).toBeNull()
  })
})
