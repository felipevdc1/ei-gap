// ---------------------------------------------------------------------------
// EI-GAP — GET /api/report/[id] Route Tests (TDD — RED phase)
// Story E2.S5 — API routes com SSE streaming
// ---------------------------------------------------------------------------
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockStore } = vi.hoisted(() => ({
  mockStore: {
    saveScan: vi.fn(),
    getScan: vi.fn(),
    updateScanStatus: vi.fn(),
    saveReport: vi.fn(),
    getReport: vi.fn(),
    saveLead: vi.fn(),
  },
}))

vi.mock('@/lib/store', () => ({
  store: mockStore,
}))

import { GET } from '../../report/[id]/route'
import type { ScanReport } from '@/types/scanner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createReportRequest(id: string): Request {
  return new Request(`http://localhost:3000/api/report/${id}`, {
    method: 'GET',
  })
}

function createRouteContext(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

const MOCK_REPORT_CONTENT: ScanReport = {
  id: 'rpt-1',
  scan_id: 'scan-1',
  executive_summary: 'Test summary',
  opportunities: [],
  total_roi_min: 1000,
  total_roi_max: 5000,
  cost_of_inaction_monthly: 200,
  gains_summary: 'gains',
  losses_summary: 'losses',
  sector: 'technology',
  company_name: 'Test Corp',
  created_at: '2024-01-01T00:00:00Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/report/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---- AC: GET /api/report with existing ID returns 200 ----

  it('returns 200 with report JSON when report exists and scan completed', async () => {
    mockStore.getReport.mockResolvedValue({
      id: 'rpt-1',
      scan_id: 'scan-1',
      content: MOCK_REPORT_CONTENT,
      status: 'completed',
      created_at: new Date(),
    })

    const request = createReportRequest('rpt-1')
    const response = await GET(request, createRouteContext('rpt-1'))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.id).toBe('rpt-1')
    expect(body.content).toEqual(MOCK_REPORT_CONTENT)
    expect(response.headers.get('Content-Type')).toContain('application/json')
  })

  // ---- AC: GET /api/report with non-existent ID returns 404 ----

  it('returns 404 when report does not exist', async () => {
    mockStore.getReport.mockResolvedValue(null)

    const request = createReportRequest('nonexistent-id')
    const response = await GET(request, createRouteContext('nonexistent-id'))

    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  // ---- Edge: returns 202 when scan is still processing ----

  it('returns 202 when report exists but scan is still processing', async () => {
    // Report not yet saved (still processing) — getReport returns null
    // but getScan returns a scan with status 'processing'
    mockStore.getReport.mockResolvedValue(null)
    mockStore.getScan.mockResolvedValue({
      id: 'scan-1',
      sector: 'technology',
      form_data: {},
      status: 'processing',
      created_at: new Date(),
    })

    const request = createReportRequest('scan-1')
    const response = await GET(request, createRouteContext('scan-1'))

    // When report not found, route should check if there's a scan still processing
    // and return 202 instead of 404
    expect(response.status).toBe(202)
    const body = await response.json()
    expect(body.status).toBe('processing')
  })

  // ---- Edge: empty id returns 400 ----

  it('returns 400 for empty id parameter', async () => {
    const request = createReportRequest('')
    const response = await GET(request, createRouteContext(''))

    expect(response.status).toBe(400)
  })
})
