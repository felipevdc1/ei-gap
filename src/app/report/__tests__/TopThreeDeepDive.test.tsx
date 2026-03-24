// ---------------------------------------------------------------------------
// EI-GAP — TopThreeDeepDive Tests (TDD — RED phase)
// Story E4b.S2a — Top 3 detailed cards
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

import { TopThreeDeepDive } from '../[id]/components/TopThreeDeepDive'
import type { RankedOpportunity } from '@/types/scanner'

// ---------------------------------------------------------------------------
// Fixture — 5 opportunities (component should display only first 3)
// ---------------------------------------------------------------------------
function makeOpportunity(rank: number): RankedOpportunity {
  return {
    rank,
    name: `Oportunidade Top ${rank}`,
    description: `Descrição detalhada da oportunidade ${rank} com informações relevantes.`,
    category: rank <= 2 ? 'Automação' : 'Análise',
    impact_score: 10 - rank * 0.3,
    feasibility_score: 9 - rank * 0.2,
    effort_score: 3 + rank * 0.1,
    roi_score: 10 - rank * 0.5,
    composite_score: 9 - rank * 0.3,
    guardrails: ['Validação humana obrigatória', 'Monitoramento contínuo'],
    roi_range_min: (11 - rank) * 10000,
    roi_range_max: (11 - rank) * 25000,
    loss_per_month: (11 - rank) * 1500,
    time_to_value: `${rank}-${rank + 2} semanas`,
    quick_win: rank <= 2,
  }
}

const opportunities: RankedOpportunity[] = Array.from({ length: 5 }, (_, i) =>
  makeOpportunity(i + 1),
)

// ---------------------------------------------------------------------------
// Rendering tests
// ---------------------------------------------------------------------------
describe('TopThreeDeepDive', () => {
  it('renders exactly 3 cards even when given more opportunities', () => {
    render(<TopThreeDeepDive opportunities={opportunities} />)
    // Only first 3 names should appear
    expect(screen.getByText('Oportunidade Top 1')).toBeInTheDocument()
    expect(screen.getByText('Oportunidade Top 2')).toBeInTheDocument()
    expect(screen.getByText('Oportunidade Top 3')).toBeInTheDocument()
    expect(screen.queryByText('Oportunidade Top 4')).not.toBeInTheDocument()
    expect(screen.queryByText('Oportunidade Top 5')).not.toBeInTheDocument()
  })

  it('renders descriptions for top 3', () => {
    render(<TopThreeDeepDive opportunities={opportunities} />)
    expect(
      screen.getByText(/descrição detalhada da oportunidade 1/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/descrição detalhada da oportunidade 2/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/descrição detalhada da oportunidade 3/i),
    ).toBeInTheDocument()
  })

  it('renders ROI ranges formatted as BRL currency', () => {
    render(<TopThreeDeepDive opportunities={opportunities} />)
    // First: roi_range_min = 100000
    expect(screen.getByText(/R\$\s*100\.000/)).toBeInTheDocument()
  })

  it('renders loss per month formatted as BRL', () => {
    render(<TopThreeDeepDive opportunities={opportunities} />)
    // First: loss_per_month = 15000
    expect(screen.getByText(/R\$\s*15\.000/)).toBeInTheDocument()
  })

  it('renders time to value', () => {
    render(<TopThreeDeepDive opportunities={opportunities} />)
    expect(screen.getByText(/1-3 semanas/)).toBeInTheDocument()
  })

  it('renders guardrails', () => {
    render(<TopThreeDeepDive opportunities={opportunities} />)
    // All 3 cards share the same guardrail
    const guardrails = screen.getAllByText(/validação humana obrigatória/i)
    expect(guardrails.length).toBeGreaterThanOrEqual(1)
  })

  it('renders section heading', () => {
    render(<TopThreeDeepDive opportunities={opportunities} />)
    expect(
      screen.getByRole('heading', { name: /top 3 principais oportunidades/i }),
    ).toBeInTheDocument()
  })

  it('shows quick win badge for quick_win opportunities', () => {
    render(<TopThreeDeepDive opportunities={opportunities} />)
    const quickWins = screen.getAllByText(/quick win/i)
    // Opportunities 1 and 2 are quick_win
    expect(quickWins.length).toBe(2)
  })

  it('renders category for each card', () => {
    render(<TopThreeDeepDive opportunities={opportunities} />)
    const automacaoLabels = screen.getAllByText('Automação')
    expect(automacaoLabels.length).toBe(2)
    expect(screen.getByText('Análise')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// A11y
// ---------------------------------------------------------------------------
describe('TopThreeDeepDive a11y', () => {
  it('has zero axe violations', async () => {
    const { container } = render(
      <TopThreeDeepDive opportunities={opportunities} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
