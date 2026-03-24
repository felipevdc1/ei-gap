// ---------------------------------------------------------------------------
// EI-GAP — POST /api/lead Route Tests (TDD — RED phase)
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

import { POST } from '../route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createLeadRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_LEAD = {
  email: 'user@example.com',
  name: 'Jane Doe',
  company: 'Acme Corp',
  scan_id: 'scan-abc-123',
  lgpd_consent: true,
  lgpd_consent_at: '2026-01-01T00:00:00.000Z',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/lead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.saveLead.mockResolvedValue(undefined)
  })

  it('returns 201 for valid lead data', async () => {
    const request = createLeadRequest(VALID_LEAD)
    const response = await POST(request)

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('saves lead to store with lgpd_consent flag', async () => {
    const request = createLeadRequest(VALID_LEAD)
    await POST(request)

    expect(mockStore.saveLead).toHaveBeenCalledTimes(1)
    const savedData = mockStore.saveLead.mock.calls[0][0]
    expect(savedData.email).toBe('user@example.com')
    expect(savedData.scan_id).toBe('scan-abc-123')
    expect(savedData.lgpd_consent).toBe(true)
  })

  it('returns 400 for invalid email', async () => {
    const request = createLeadRequest({ ...VALID_LEAD, email: 'not-an-email' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 for missing scan_id', async () => {
    const request = createLeadRequest({ email: 'user@example.com' })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 400 for missing email', async () => {
    const request = createLeadRequest({ scan_id: 'scan-123' })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 400 for non-JSON body', async () => {
    const request = new Request('http://localhost:3000/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not json',
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('accepts lead without optional name and company', async () => {
    const request = createLeadRequest({
      email: 'minimal@test.com',
      scan_id: 'scan-xyz',
      lgpd_consent: true,
      lgpd_consent_at: '2026-01-01T00:00:00.000Z',
    })
    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(mockStore.saveLead).toHaveBeenCalledTimes(1)
  })

  // -----------------------------------------------------------------------
  // LGPD consent validation (Story E5.S3)
  // -----------------------------------------------------------------------

  it('returns 400 when lgpd_consent is missing', async () => {
    const { lgpd_consent: _, lgpd_consent_at: __, ...noConsent } = VALID_LEAD
    void _
    void __
    const request = createLeadRequest(noConsent)
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 400 when lgpd_consent is false', async () => {
    const request = createLeadRequest({ ...VALID_LEAD, lgpd_consent: false })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 400 when lgpd_consent_at is missing', async () => {
    const { lgpd_consent_at: _, ...noTimestamp } = VALID_LEAD
    void _
    const request = createLeadRequest(noTimestamp)
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('saves lgpd_consent and lgpd_consent_at to store', async () => {
    const request = createLeadRequest(VALID_LEAD)
    await POST(request)

    expect(mockStore.saveLead).toHaveBeenCalledWith(
      expect.objectContaining({
        lgpd_consent: true,
        lgpd_consent_at: '2026-01-01T00:00:00.000Z',
      }),
    )
  })

  it('returns 500 when store throws', async () => {
    mockStore.saveLead.mockRejectedValue(new Error('Store failure'))

    const request = createLeadRequest(VALID_LEAD)
    const response = await POST(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})
