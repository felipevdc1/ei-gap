// ---------------------------------------------------------------------------
// EI-GAP — OpportunitiesTable Tests (TDD — RED phase)
// Story E4b.S2a — Top 10 table with scores, ROI ranges
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

import { OpportunitiesTable } from '../[id]/components/OpportunitiesTable'
import type { RankedOpportunity } from '@/types/scanner'

// ---------------------------------------------------------------------------
// Fixture — 10 opportunities
// ---------------------------------------------------------------------------
function makeOpportunity(rank: number): RankedOpportunity {
  return {
    rank,
    name: `Oportunidade ${rank}`,
    description: `Descrição da oportunidade ${rank}`,
    category: 'Automação',
    impact_score: 10 - rank * 0.3,
    feasibility_score: 9 - rank * 0.2,
    effort_score: 3 + rank * 0.1,
    roi_score: 10 - rank * 0.5,
    composite_score: 9 - rank * 0.3,
    guardrails: ['Validação humana obrigatória'],
    roi_range_min: (11 - rank) * 10000,
    roi_range_max: (11 - rank) * 25000,
    loss_per_month: (11 - rank) * 1500,
    time_to_value: `${rank}-${rank + 2} semanas`,
    quick_win: rank <= 3,
  }
}

const opportunities: RankedOpportunity[] = Array.from({ length: 10 }, (_, i) =>
  makeOpportunity(i + 1),
)

// ---------------------------------------------------------------------------
// Rendering tests
// ---------------------------------------------------------------------------
describe('OpportunitiesTable', () => {
  it('renders all 10 opportunities in the table', () => {
    render(<OpportunitiesTable opportunities={opportunities} />)
    const rows = screen.getAllByRole('row')
    // 1 header row + 10 data rows
    expect(rows.length).toBe(11)
  })

  it('renders opportunity names in table cells', () => {
    render(<OpportunitiesTable opportunities={opportunities} />)
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(`Oportunidade ${i}`)).toBeInTheDocument()
    }
  })

  it('renders ROI range formatted as BRL currency', () => {
    render(<OpportunitiesTable opportunities={opportunities} />)
    // First opportunity: roi_range_min = 100000, roi_range_max = 250000
    // Appears in both mobile inline text and desktop column
    const minMatches = screen.getAllByText(/R\$\s*100\.000/)
    const maxMatches = screen.getAllByText(/R\$\s*250\.000/)
    expect(minMatches.length).toBeGreaterThanOrEqual(1)
    expect(maxMatches.length).toBeGreaterThanOrEqual(1)
  })

  it('uses semantic th with scope="col" for column headers', () => {
    render(<OpportunitiesTable opportunities={opportunities} />)
    const headerRow = screen.getAllByRole('row')[0]
    const headers = within(headerRow).getAllByRole('columnheader')
    expect(headers.length).toBeGreaterThanOrEqual(3)
    headers.forEach((th) => {
      expect(th).toHaveAttribute('scope', 'col')
    })
  })

  it('displays composite scores', () => {
    render(<OpportunitiesTable opportunities={opportunities} />)
    // First opportunity composite_score = 8.7
    expect(screen.getByText('8.7')).toBeInTheDocument()
  })

  it('renders section heading', () => {
    render(<OpportunitiesTable opportunities={opportunities} />)
    expect(
      screen.getByRole('heading', { name: /oportunidades/i }),
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// A11y
// ---------------------------------------------------------------------------
describe('OpportunitiesTable a11y', () => {
  it('has zero axe violations', async () => {
    const { container } = render(
      <OpportunitiesTable opportunities={opportunities} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
