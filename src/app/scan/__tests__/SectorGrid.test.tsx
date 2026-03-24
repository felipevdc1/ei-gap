import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { SectorGrid } from '../components/SectorGrid'
import type { SectorProfile } from '@/lib/data/loader'

expect.extend(matchers)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSectors(count = 8): SectorProfile[] {
  return Array.from({ length: count }, (_, i) => ({
    slug: `sector-${i}`,
    name: `Sector ${i}`,
    keywords: ['kw'],
    typical_processes: ['proc'],
    specific_questions: ['question?'],
    high_roi_opportunities: ['opp'],
  }))
}

const defaultProps = {
  sectors: makeSectors(),
  selectedSector: '',
  onSelect: vi.fn(),
}

function renderGrid(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, onSelect: vi.fn(), ...overrides }
  return { ...render(<SectorGrid {...props} />), onSelect: props.onSelect }
}

// ---------------------------------------------------------------------------
// 1. Renders sector cards
// ---------------------------------------------------------------------------

describe('SectorGrid — Rendering', () => {
  it('renders 8 sector cards + 1 "Outro" card', () => {
    renderGrid()
    const buttons = screen.getAllByRole('button')
    // 8 named sectors + 1 "Outro"
    expect(buttons).toHaveLength(9)
  })

  it('renders all sector names from props', () => {
    renderGrid()
    for (let i = 0; i < 8; i++) {
      expect(screen.getByText(`Sector ${i}`)).toBeInTheDocument()
    }
  })

  it('renders an "Outro" option', () => {
    renderGrid()
    expect(screen.getByText('Outro')).toBeInTheDocument()
  })

  it('displays cards in a grid layout', () => {
    renderGrid()
    const grid = screen.getByRole('group')
    expect(grid).toHaveClass('grid')
  })
})

// ---------------------------------------------------------------------------
// 2. Selection behavior
// ---------------------------------------------------------------------------

describe('SectorGrid — Selection', () => {
  it('calls onSelect with sector slug when card is clicked', async () => {
    const { onSelect } = renderGrid()
    const user = userEvent.setup()

    await user.click(screen.getByText('Sector 0'))
    expect(onSelect).toHaveBeenCalledWith('sector-0')
  })

  it('calls onSelect with "outro" when Outro card is clicked', async () => {
    const { onSelect } = renderGrid()
    const user = userEvent.setup()

    await user.click(screen.getByText('Outro'))
    expect(onSelect).toHaveBeenCalledWith('outro')
  })

  it('marks the selected sector card as active', () => {
    renderGrid({ selectedSector: 'sector-2' })
    const card = screen.getByText('Sector 2').closest('[role="button"]')
    expect(card).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks non-selected cards as not active', () => {
    renderGrid({ selectedSector: 'sector-2' })
    const card = screen.getByText('Sector 0').closest('[role="button"]')
    expect(card).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks "Outro" card as active when selectedSector is "outro"', () => {
    renderGrid({ selectedSector: 'outro' })
    const card = screen.getByText('Outro').closest('[role="button"]')
    expect(card).toHaveAttribute('aria-pressed', 'true')
  })
})

// ---------------------------------------------------------------------------
// 3. Keyboard navigation
// ---------------------------------------------------------------------------

describe('SectorGrid — Keyboard Navigation', () => {
  it('cards have role="button" and tabIndex={0}', () => {
    renderGrid()
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('tabindex', '0')
    })
  })

  it('triggers selection with Enter key', async () => {
    const { onSelect } = renderGrid()
    const user = userEvent.setup()

    const card = screen.getByText('Sector 0').closest('[role="button"]') as HTMLElement
    card.focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('sector-0')
  })

  it('triggers selection with Space key', async () => {
    const { onSelect } = renderGrid()
    const user = userEvent.setup()

    const card = screen.getByText('Sector 1').closest('[role="button"]') as HTMLElement
    card.focus()
    await user.keyboard(' ')
    expect(onSelect).toHaveBeenCalledWith('sector-1')
  })
})

// ---------------------------------------------------------------------------
// 4. Reduced motion
// ---------------------------------------------------------------------------

describe('SectorGrid — Reduced Motion', () => {
  it('includes motion-safe classes for animations', () => {
    renderGrid()
    const buttons = screen.getAllByRole('button')
    // At least one card should have motion-safe transition class
    const hasMotionSafe = buttons.some(
      (btn) =>
        btn.className.includes('motion-safe:') ||
        btn.className.includes('transition'),
    )
    expect(hasMotionSafe).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. Accessibility — axe-core
// ---------------------------------------------------------------------------

describe('SectorGrid — Accessibility', () => {
  it('has zero a11y violations with no selection', async () => {
    const { container } = renderGrid()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero a11y violations with a selection', async () => {
    const { container } = renderGrid({ selectedSector: 'sector-3' })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('cards have accessible labels', () => {
    renderGrid()
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      // Each card should be identifiable by its text content
      expect(btn.textContent).toBeTruthy()
    })
  })
})
