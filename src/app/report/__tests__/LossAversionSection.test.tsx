// ---------------------------------------------------------------------------
// EI-GAP — LossAversionSection Tests (TDD — RED phase)
// Story E4b.S2a — Loss Aversion: GAINS vs LOSSES in 2 columns
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

import { LossAversionSection } from '../[id]/components/LossAversionSection'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
const defaultProps = {
  gains_summary: 'Economia de 65h/semana com automação.',
  losses_summary: 'Perda de R$25.000/mês sem ação.',
  total_roi_min: 150000,
  total_roi_max: 450000,
  cost_of_inaction_monthly: 25000,
}

// ---------------------------------------------------------------------------
// Rendering tests
// ---------------------------------------------------------------------------
describe('LossAversionSection', () => {
  it('renders the section heading', () => {
    render(<LossAversionSection {...defaultProps} />)
    expect(
      screen.getByRole('heading', { name: /ganhos.*perdas|o que você ganha.*o que você perde/i }),
    ).toBeInTheDocument()
  })

  it('renders gains summary text', () => {
    render(<LossAversionSection {...defaultProps} />)
    expect(
      screen.getByText(/economia de 65h\/semana com automação/i),
    ).toBeInTheDocument()
  })

  it('renders losses summary text', () => {
    render(<LossAversionSection {...defaultProps} />)
    expect(
      screen.getByText(/perda de r\$25\.000\/mês sem ação/i),
    ).toBeInTheDocument()
  })

  it('renders ROI range formatted as BRL currency', () => {
    render(<LossAversionSection {...defaultProps} />)
    expect(screen.getByText(/R\$\s*150\.000/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*450\.000/)).toBeInTheDocument()
  })

  it('renders cost of inaction formatted as BRL currency', () => {
    render(<LossAversionSection {...defaultProps} />)
    // May appear in both the losses_summary text and the formatted number
    const matches = screen.getAllByText(/R\$\s*25\.000/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('has aria-live="polite" for animated region', () => {
    const { container } = render(<LossAversionSection {...defaultProps} />)
    const liveRegions = container.querySelectorAll('[aria-live="polite"]')
    expect(liveRegions.length).toBeGreaterThanOrEqual(1)
  })

  it('respects prefers-reduced-motion', () => {
    const { container } = render(<LossAversionSection {...defaultProps} />)
    const html = container.innerHTML
    // Component must have motion-safe or motion-reduce classes for animations
    expect(html).toMatch(/motion-safe|motion-reduce/)
  })

  it('renders two distinct column sections (gains and losses)', () => {
    render(<LossAversionSection {...defaultProps} />)
    // Both gains and losses headings present
    expect(screen.getByText(/o que você ganha/i)).toBeInTheDocument()
    expect(screen.getByText(/o que você perde/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// A11y
// ---------------------------------------------------------------------------
describe('LossAversionSection a11y', () => {
  it('has zero axe violations', async () => {
    const { container } = render(<LossAversionSection {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
