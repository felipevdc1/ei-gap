// ---------------------------------------------------------------------------
// EI-GAP — SupabaseStore Tests (TDD — RED phase)
// Mocks the Supabase client; no real database required.
// ---------------------------------------------------------------------------
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ScanFormData, ScanReport, ScanStatus } from '@/types/scanner'
import type { ScanStore } from '../interface'

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

const mockSingle = vi.fn()
const mockMaybeSingle = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()

// Build a chainable query builder mock
function createChainMock() {
  const chain = {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
    upsert: vi.fn(),
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  }

  // Every method returns the chain for fluent API
  mockInsert.mockReturnValue(chain)
  mockSelect.mockReturnValue(chain)
  mockUpdate.mockReturnValue(chain)
  mockEq.mockReturnValue(chain)
  chain.upsert.mockReturnValue(chain)

  return chain
}

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}))

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
// Import the implementation (will fail in RED phase)
// ---------------------------------------------------------------------------
// Dynamic import so mock is established first
let SupabaseStore: new () => ScanStore

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('../supabase')
  SupabaseStore = mod.SupabaseStore as unknown as new () => ScanStore
})

// ---------------------------------------------------------------------------
// Interface contract — SupabaseStore implements ScanStore
// ---------------------------------------------------------------------------

describe('SupabaseStore — interface contract', () => {
  it('implements all ScanStore methods', async () => {
    const store = new SupabaseStore()
    expect(typeof store.saveScan).toBe('function')
    expect(typeof store.getScan).toBe('function')
    expect(typeof store.updateScanStatus).toBe('function')
    expect(typeof store.saveReport).toBe('function')
    expect(typeof store.getReport).toBe('function')
    expect(typeof store.saveLead).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// CRUD — Scans
// ---------------------------------------------------------------------------

describe('SupabaseStore — Scan CRUD', () => {
  let store: ScanStore

  beforeEach(() => {
    store = new SupabaseStore()
  })

  it('saveScan inserts into scans table', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockInsert.mockReturnValue({ error: null })

    const formData = makeScanFormData()

    await store.saveScan('scan-1', {
      sector: 'tech',
      company_name: 'Acme Corp',
      company_size: '11-50',
      form_data: formData,
      status: 'pending' as ScanStatus,
      ip_hash: 'abc123',
    })

    expect(mockFrom).toHaveBeenCalledWith('scans')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'scan-1',
        sector: 'tech',
        company_name: 'Acme Corp',
        company_size: '11-50',
        form_data: formData,
        status: 'pending',
        ip_hash: 'abc123',
      })
    )
  })

  it('saveScan throws on Supabase error', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockInsert.mockReturnValue({ error: { message: 'insert failed' } })

    const formData = makeScanFormData()

    await expect(
      store.saveScan('scan-1', {
        sector: 'tech',
        form_data: formData,
        status: 'pending' as ScanStatus,
      })
    ).rejects.toThrow('insert failed')
  })

  it('getScan retrieves from scans table by id', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockMaybeSingle.mockReturnValue({
      data: {
        id: 'scan-1',
        sector: 'tech',
        company_name: 'Acme Corp',
        form_data: makeScanFormData(),
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
      },
      error: null,
    })

    const result = await store.getScan('scan-1')

    expect(mockFrom).toHaveBeenCalledWith('scans')
    expect(mockSelect).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('id', 'scan-1')
    expect(result).not.toBeNull()
    expect(result!.id).toBe('scan-1')
    expect(result!.sector).toBe('tech')
    expect(result!.created_at).toBeInstanceOf(Date)
  })

  it('getScan returns null when not found', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockMaybeSingle.mockReturnValue({ data: null, error: null })

    const result = await store.getScan('does-not-exist')
    expect(result).toBeNull()
  })

  it('updateScanStatus updates status in scans table', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockEq.mockReturnValue({ error: null })

    await store.updateScanStatus('scan-1', 'processing')

    expect(mockFrom).toHaveBeenCalledWith('scans')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'processing' })
    )
    expect(mockEq).toHaveBeenCalledWith('id', 'scan-1')
  })

  it('updateScanStatus includes error when provided', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockEq.mockReturnValue({ error: null })

    await store.updateScanStatus('scan-1', 'failed', 'timeout')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', error: 'timeout' })
    )
  })

  it('updateScanStatus throws on Supabase error', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockEq.mockReturnValue({ error: { message: 'update failed' } })

    await expect(
      store.updateScanStatus('scan-1', 'completed')
    ).rejects.toThrow('update failed')
  })
})

// ---------------------------------------------------------------------------
// CRUD — Reports
// ---------------------------------------------------------------------------

describe('SupabaseStore — Report CRUD', () => {
  let store: ScanStore

  beforeEach(() => {
    store = new SupabaseStore()
  })

  it('saveReport inserts into reports table', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockInsert.mockReturnValue({ error: null })

    const report = makeScanReport()
    await store.saveReport('report-1', 'scan-1', report)

    expect(mockFrom).toHaveBeenCalledWith('reports')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'report-1',
        scan_id: 'scan-1',
        content: report,
        status: 'completed',
      })
    )
  })

  it('saveReport throws on Supabase error', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockInsert.mockReturnValue({ error: { message: 'insert failed' } })

    await expect(
      store.saveReport('report-1', 'scan-1', makeScanReport())
    ).rejects.toThrow('insert failed')
  })

  it('getReport retrieves from reports table by id', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockMaybeSingle.mockReturnValue({
      data: {
        id: 'report-1',
        scan_id: 'scan-1',
        content: makeScanReport(),
        status: 'completed',
        created_at: '2025-01-01T00:00:00Z',
      },
      error: null,
    })

    const result = await store.getReport('report-1')

    expect(mockFrom).toHaveBeenCalledWith('reports')
    expect(result).not.toBeNull()
    expect(result!.id).toBe('report-1')
    expect(result!.scan_id).toBe('scan-1')
    expect(result!.created_at).toBeInstanceOf(Date)
  })

  it('getReport returns null when not found', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockMaybeSingle.mockReturnValue({ data: null, error: null })

    const result = await store.getReport('ghost')
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// CRUD — Leads
// ---------------------------------------------------------------------------

describe('SupabaseStore — Lead CRUD', () => {
  let store: ScanStore

  beforeEach(() => {
    store = new SupabaseStore()
  })

  it('saveLead inserts into leads table', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockInsert.mockReturnValue({ error: null })

    await store.saveLead({
      scan_id: 'scan-1',
      email: 'user@example.com',
      name: 'John',
      company: 'Acme',
      lgpd_consent: true,
      lgpd_consent_at: '2026-01-01T00:00:00.000Z',
    })

    expect(mockFrom).toHaveBeenCalledWith('leads')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        scan_id: 'scan-1',
        email: 'user@example.com',
        name: 'John',
        company: 'Acme',
        lgpd_consent: true,
      })
    )
  })

  it('saveLead includes lgpd_consent_at when consent is true', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockInsert.mockReturnValue({ error: null })

    await store.saveLead({
      scan_id: 'scan-1',
      email: 'user@example.com',
      lgpd_consent: true,
      lgpd_consent_at: '2026-01-01T00:00:00.000Z',
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        lgpd_consent: true,
        lgpd_consent_at: '2026-01-01T00:00:00.000Z',
      })
    )
  })

  it('saveLead throws on Supabase error', async () => {
    const chain = createChainMock()
    mockFrom.mockReturnValue(chain)
    mockInsert.mockReturnValue({ error: { message: 'insert failed' } })

    await expect(
      store.saveLead({
        scan_id: 'scan-1',
        email: 'user@example.com',
        lgpd_consent: true,
        lgpd_consent_at: '2026-01-01T00:00:00.000Z',
      })
    ).rejects.toThrow('insert failed')
  })
})
