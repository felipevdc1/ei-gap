import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { ReviewStep } from '../components/ReviewStep'
import type { BusinessInfoData } from '../components/BusinessInfoStep'
import type { ScanFormProcess } from '../components/ProcessMappingStep'

expect.extend(matchers)

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockBusinessInfo: BusinessInfoData = {
  company_name: 'Acme Corp',
  company_size: '11-50',
  tech_maturity: 'medium',
  current_tools: 'Slack, Notion',
}

const mockProcesses: ScanFormProcess[] = [
  { name: 'Atendimento ao cliente', time_per_week: 20, pain_level: 4 },
  { name: 'Gestão de estoque', time_per_week: 10, pain_level: 3 },
  { name: 'Faturamento', time_per_week: 15, pain_level: 5 },
]

const mockSectorAnswers: Record<string, string> = {
  q0: 'Usamos planilhas para tudo',
  q1: 'Sem automação ainda',
}

const defaultProps = {
  sector: 'varejo',
  businessInfo: mockBusinessInfo,
  sectorAnswers: mockSectorAnswers,
  processes: mockProcesses,
  onEditStep: vi.fn(),
}

function renderReview(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, onEditStep: vi.fn(), ...overrides }
  return { ...render(<ReviewStep {...props} />), onEditStep: props.onEditStep }
}

// ---------------------------------------------------------------------------
// 1. Summary shows correct data from all steps
// ---------------------------------------------------------------------------

describe('ReviewStep — Data Summary', () => {
  it('shows the selected sector', () => {
    renderReview()
    expect(screen.getByText(/varejo/i)).toBeInTheDocument()
  })

  it('shows company name', () => {
    renderReview()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('shows company size', () => {
    renderReview()
    expect(screen.getByText(/11-50/)).toBeInTheDocument()
  })

  it('shows tech maturity', () => {
    renderReview()
    // "medium" should be displayed as a label (Média) in the business section
    const businessSection = screen.getByTestId('review-section-business')
    expect(within(businessSection).getByText(/Média/i)).toBeInTheDocument()
  })

  it('shows current tools when provided', () => {
    renderReview()
    expect(screen.getByText(/Slack, Notion/)).toBeInTheDocument()
  })

  it('shows all processes', () => {
    renderReview()
    expect(screen.getByText('Atendimento ao cliente')).toBeInTheDocument()
    expect(screen.getByText('Gestão de estoque')).toBeInTheDocument()
    expect(screen.getByText('Faturamento')).toBeInTheDocument()
  })

  it('shows process details (time and pain level)', () => {
    renderReview()
    expect(screen.getByText(/20h/)).toBeInTheDocument()
    expect(screen.getByText(/10h/)).toBeInTheDocument()
    expect(screen.getByText(/15h/)).toBeInTheDocument()
  })

  it('shows sector answers', () => {
    renderReview()
    expect(screen.getByText('Usamos planilhas para tudo')).toBeInTheDocument()
    expect(screen.getByText('Sem automação ainda')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 2. Edit buttons navigate to correct steps
// ---------------------------------------------------------------------------

describe('ReviewStep — Edit Buttons', () => {
  it('has an edit button for each section', () => {
    renderReview()
    const editButtons = screen.getAllByRole('button', { name: /editar/i })
    expect(editButtons.length).toBeGreaterThanOrEqual(4)
  })

  it('clicking edit on sector section calls onEditStep(1)', async () => {
    const { onEditStep } = renderReview()
    const user = userEvent.setup()

    const sectorSection = screen.getByTestId('review-section-sector')
    const editBtn = within(sectorSection).getByRole('button', { name: /editar/i })
    await user.click(editBtn)

    expect(onEditStep).toHaveBeenCalledWith(1)
  })

  it('clicking edit on company section calls onEditStep(2)', async () => {
    const { onEditStep } = renderReview()
    const user = userEvent.setup()

    const section = screen.getByTestId('review-section-business')
    const editBtn = within(section).getByRole('button', { name: /editar/i })
    await user.click(editBtn)

    expect(onEditStep).toHaveBeenCalledWith(2)
  })

  it('clicking edit on questions section calls onEditStep(3)', async () => {
    const { onEditStep } = renderReview()
    const user = userEvent.setup()

    const section = screen.getByTestId('review-section-questions')
    const editBtn = within(section).getByRole('button', { name: /editar/i })
    await user.click(editBtn)

    expect(onEditStep).toHaveBeenCalledWith(3)
  })

  it('clicking edit on processes section calls onEditStep(4)', async () => {
    const { onEditStep } = renderReview()
    const user = userEvent.setup()

    const section = screen.getByTestId('review-section-processes')
    const editBtn = within(section).getByRole('button', { name: /editar/i })
    await user.click(editBtn)

    expect(onEditStep).toHaveBeenCalledWith(4)
  })
})

// ---------------------------------------------------------------------------
// 3. Edge cases
// ---------------------------------------------------------------------------

describe('ReviewStep — Edge Cases', () => {
  it('handles empty current_tools gracefully', () => {
    renderReview({
      businessInfo: { ...mockBusinessInfo, current_tools: '' },
    })
    // Should not crash, and should show a placeholder or nothing
    expect(screen.getByTestId('review-section-business')).toBeInTheDocument()
  })

  it('handles empty sector answers gracefully', () => {
    renderReview({ sectorAnswers: {} })
    expect(screen.getByTestId('review-section-questions')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 4. Accessibility
// ---------------------------------------------------------------------------

describe('ReviewStep — Accessibility', () => {
  it('has no a11y violations', async () => {
    const { container } = renderReview()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
