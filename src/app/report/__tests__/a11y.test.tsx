// ---------------------------------------------------------------------------
// EI-GAP — Report Sections A11y Tests (TDD — RED phase)
// Story E4b.S2a — Comprehensive a11y checks
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

import { LossAversionSection } from '../[id]/components/LossAversionSection'
import { OpportunitiesTable } from '../[id]/components/OpportunitiesTable'
import { TopThreeDeepDive } from '../[id]/components/TopThreeDeepDive'
import type { RankedOpportunity } from '@/types/scanner'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const lossAversionProps = {
  gains_summary: 'Economia de 65h/semana com automação.',
  losses_summary: 'Perda de R$25.000/mês sem ação.',
  total_roi_min: 150000,
  total_roi_max: 450000,
  cost_of_inaction_monthly: 25000,
}

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
    guardrails: ['Validação humana'],
    roi_range_min: (11 - rank) * 10000,
    roi_range_max: (11 - rank) * 25000,
    loss_per_month: (11 - rank) * 1500,
    time_to_value: `${rank}-${rank + 2} semanas`,
    quick_win: rank <= 3,
  }
}

const opportunities = Array.from({ length: 10 }, (_, i) =>
  makeOpportunity(i + 1),
)

// ---------------------------------------------------------------------------
// Combined a11y tests for all E4b.S2a components
// ---------------------------------------------------------------------------
describe('Report Data Sections — a11y (axe-core)', () => {
  it('LossAversionSection has zero violations', async () => {
    const { container } = render(<LossAversionSection {...lossAversionProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('OpportunitiesTable has zero violations', async () => {
    const { container } = render(
      <OpportunitiesTable opportunities={opportunities} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('TopThreeDeepDive has zero violations', async () => {
    const { container } = render(
      <TopThreeDeepDive opportunities={opportunities} />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('all sections rendered together have zero violations', async () => {
    const { container } = render(
      <div>
        <LossAversionSection {...lossAversionProps} />
        <OpportunitiesTable opportunities={opportunities} />
        <TopThreeDeepDive opportunities={opportunities} />
      </div>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
