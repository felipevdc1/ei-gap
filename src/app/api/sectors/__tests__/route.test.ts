// ---------------------------------------------------------------------------
// EI-GAP — GET /api/sectors Route Tests (TDD — RED phase)
// Story E2.S5 — API routes com SSE streaming
// ---------------------------------------------------------------------------
import { describe, it, expect, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSectorProfiles = vi.fn()
vi.mock('@/lib/data/loader', () => ({
  getSectorProfiles: () => mockGetSectorProfiles(),
}))

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/sectors', () => {
  it('returns list of sectors from YAML loader', async () => {
    mockGetSectorProfiles.mockReturnValue({
      sectors: [
        { slug: 'technology', name: 'Technology', keywords: [], typical_processes: [], specific_questions: [], high_roi_opportunities: [] },
        { slug: 'healthcare', name: 'Healthcare', keywords: [], typical_processes: [], specific_questions: [], high_roi_opportunities: [] },
      ],
      generic: { name: 'Generic', universal_questions: [] },
    })

    const request = new Request('http://localhost:3000/api/sectors', { method: 'GET' })
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.sectors).toHaveLength(2)
    expect(body.sectors[0].slug).toBe('technology')
    expect(body.sectors[1].slug).toBe('healthcare')
  })

  it('returns sector names and slugs (minimal data for dropdown)', async () => {
    mockGetSectorProfiles.mockReturnValue({
      sectors: [
        { slug: 'retail', name: 'Retail', keywords: ['shop'], typical_processes: ['sales'], specific_questions: ['q1'], high_roi_opportunities: ['opp1'] },
      ],
      generic: { name: 'Generic', universal_questions: ['u1'] },
    })

    const request = new Request('http://localhost:3000/api/sectors', { method: 'GET' })
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    // Should include slug and name at minimum
    expect(body.sectors[0]).toHaveProperty('slug')
    expect(body.sectors[0]).toHaveProperty('name')
  })

  it('returns 500 when loader throws', async () => {
    mockGetSectorProfiles.mockImplementation(() => {
      throw new Error('YAML file not found')
    })

    const request = new Request('http://localhost:3000/api/sectors', { method: 'GET' })
    const response = await GET(request)

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })
})
