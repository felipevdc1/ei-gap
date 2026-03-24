import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { ScanForm } from '../components/ScanForm'

expect.extend(matchers)
import type { SectorProfile, GenericSector } from '@/lib/data/loader'

// Mock next/navigation for ScanLoading component
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock fetch for ScanLoading — prevent actual API calls
const originalFetch = globalThis.fetch
beforeEach(() => {
  globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
})
afterEach(() => {
  globalThis.fetch = originalFetch
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STEP_TITLES = [
  'Sector Selection',
  'Company Info',
  'Sector Questions',
  'Process Mapping',
  'Review & Submit',
] as const

function makeSectors(count = 3): SectorProfile[] {
  return Array.from({ length: count }, (_, i) => ({
    slug: `sector-${i}`,
    name: `Sector ${i}`,
    keywords: ['kw'],
    typical_processes: ['proc'],
    specific_questions: ['question?'],
    high_roi_opportunities: ['opp'],
  }))
}

const defaultGeneric: GenericSector = {
  name: 'Genérico',
  universal_questions: ['Qual o setor e tamanho da empresa?'],
}

function renderForm(sectors = makeSectors(), generic = defaultGeneric) {
  return render(<ScanForm sectors={sectors} generic={generic} />)
}

/** Get the currently visible step container and verify its heading */
function expectStepVisible(stepNum: number) {
  const stepEl = screen.getByTestId(`step-${stepNum}`)
  expect(stepEl).toBeInTheDocument()
  const heading = within(stepEl).getByRole('heading', { level: 2 })
  expect(heading).toHaveTextContent(STEP_TITLES[stepNum - 1])
  return stepEl
}

/** Fill step 1 (select a sector) so that navigation can proceed */
async function fillStep1(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText('Sector 0'))
}

/** Fill step 2 (business info) so that navigation can proceed */
async function fillStep2(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nome da empresa/i), 'Acme Corp')
  await user.selectOptions(screen.getByLabelText(/tamanho/i), '11-50')
  await user.selectOptions(screen.getByLabelText(/maturidade tecnol/i), 'medium')
}

/** Fill step 4 (process mapping) with minimum 3 processes so that navigation can proceed */
async function fillStep4(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < 3; i++) {
    await user.click(screen.getByRole('button', { name: /adicionar processo/i }))
  }
  // Fill process names (required for meaningful data)
  const nameInputs = screen.getAllByLabelText(/nome do processo/i)
  for (let i = 0; i < nameInputs.length; i++) {
    await user.type(nameInputs[i], `Processo ${i + 1}`)
  }
  // Fill time inputs
  const timeInputs = screen.getAllByLabelText(/horas.*semana/i)
  for (let i = 0; i < timeInputs.length; i++) {
    await user.type(timeInputs[i], '5')
  }
}

/** Navigate from step 1 to a target step, filling required data along the way */
async function navigateToStep(
  user: ReturnType<typeof userEvent.setup>,
  targetStep: number,
) {
  for (let current = 1; current < targetStep; current++) {
    if (current === 1) await fillStep1(user)
    if (current === 2) await fillStep2(user)
    if (current === 4) await fillStep4(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
  }
}

// ---------------------------------------------------------------------------
// 1. Renders 5 steps — navigation works
// ---------------------------------------------------------------------------

describe('ScanForm — Step Rendering', () => {
  it('renders step 1 by default with correct testid', () => {
    renderForm()
    expectStepVisible(1)
  })

  it('renders all 5 steps accessible via navigation', async () => {
    renderForm()
    const user = userEvent.setup()

    for (let i = 0; i < STEP_TITLES.length; i++) {
      expectStepVisible(i + 1)

      // Navigate to next step (skip for last step)
      if (i < STEP_TITLES.length - 1) {
        if (i + 1 === 1) await fillStep1(user)
        if (i + 1 === 2) await fillStep2(user)
        if (i + 1 === 4) await fillStep4(user)
        const nextBtn = screen.getByRole('button', { name: /next/i })
        await user.click(nextBtn)
      }
    }
  })

  it('does not show step 2 content when on step 1', () => {
    renderForm()
    expect(screen.getByTestId('step-1')).toBeInTheDocument()
    expect(screen.queryByTestId('step-2')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 2. Next/back navigation
// ---------------------------------------------------------------------------

describe('ScanForm — Navigation', () => {
  it('navigates forward with Next button', async () => {
    renderForm()
    const user = userEvent.setup()

    await fillStep1(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByTestId('step-2')).toBeInTheDocument()
    expect(screen.queryByTestId('step-1')).not.toBeInTheDocument()
  })

  it('navigates backward with Back button', async () => {
    renderForm()
    const user = userEvent.setup()

    // Go to step 2
    await fillStep1(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByTestId('step-2')).toBeInTheDocument()

    // Go back to step 1
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByTestId('step-1')).toBeInTheDocument()
  })

  it('does not show Back button on step 1', () => {
    renderForm()
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('shows Back button on steps 2-5', async () => {
    renderForm()
    const user = userEvent.setup()

    for (let i = 1; i <= 4; i++) {
      if (i === 1) await fillStep1(user)
      if (i === 2) await fillStep2(user)
      if (i === 4) await fillStep4(user)
      await user.click(screen.getByRole('button', { name: /next/i }))
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    }
  })

  it('shows Submit button on step 5 instead of Next', async () => {
    renderForm()
    const user = userEvent.setup()

    await navigateToStep(user, 5)

    expect(screen.getByTestId('step-5')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gerar diagnóstico/i })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 3. State preservation between steps
// ---------------------------------------------------------------------------

describe('ScanForm — State Preservation', () => {
  it('preserves state when navigating back and forth', async () => {
    renderForm()
    const user = userEvent.setup()

    // Step 1 is visible
    expect(screen.getByTestId('step-1')).toBeInTheDocument()

    // Go forward to step 3
    await navigateToStep(user, 3)
    expect(screen.getByTestId('step-3')).toBeInTheDocument()

    // Go back to step 1
    await user.click(screen.getByRole('button', { name: /back/i }))
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByTestId('step-1')).toBeInTheDocument()

    // Sector should still be selected (state preserved)
    const sectorCard = screen.getByText('Sector 0').closest('[role="button"]')
    expect(sectorCard).toHaveAttribute('aria-pressed', 'true')

    // Go forward again — should still reach step 2 (state not corrupted)
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByTestId('step-2')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 4. Progress indicator
// ---------------------------------------------------------------------------

describe('ScanForm — Progress Indicator', () => {
  it('renders a progress indicator with aria-current="step" on active step', () => {
    renderForm()
    const progressNav = screen.getByRole('navigation', { name: /progress/i })
    expect(progressNav).toBeInTheDocument()

    const currentStep = within(progressNav).getByText(/sector selection/i)
    expect(currentStep.closest('[aria-current="step"]')).toBeInTheDocument()
  })

  it('updates aria-current when navigating', async () => {
    renderForm()
    const user = userEvent.setup()
    const progressNav = screen.getByRole('navigation', { name: /progress/i })

    await fillStep1(user)
    await user.click(screen.getByRole('button', { name: /next/i }))

    const step2Indicator = within(progressNav).getByText(/company info/i)
    expect(step2Indicator.closest('[aria-current="step"]')).toBeInTheDocument()

    // Step 1 should no longer be current
    const step1Indicator = within(progressNav).getByText(/sector selection/i)
    expect(step1Indicator.closest('[aria-current="step"]')).toBeNull()
  })

  it('all progress items have aria-label', () => {
    renderForm()
    const progressNav = screen.getByRole('navigation', { name: /progress/i })
    const items = within(progressNav).getAllByRole('listitem')
    expect(items).toHaveLength(5)

    items.forEach((item) => {
      expect(item).toHaveAttribute('aria-label')
    })
  })
})

// ---------------------------------------------------------------------------
// 5. Focus management
// ---------------------------------------------------------------------------

describe('ScanForm — Focus Management', () => {
  it('auto-focuses on step container when navigating', async () => {
    renderForm()
    const user = userEvent.setup()

    await fillStep1(user)
    await user.click(screen.getByRole('button', { name: /next/i }))

    const step2 = screen.getByTestId('step-2')
    expect(step2).toHaveFocus()
  })
})

// ---------------------------------------------------------------------------
// 6. Debounce on submit (prevent double-click)
// ---------------------------------------------------------------------------

describe('ScanForm — Submit', () => {
  it('shows loading screen after clicking submit', async () => {
    renderForm()
    const user = userEvent.setup()

    // Navigate to step 5
    await navigateToStep(user, 5)

    const submitBtn = screen.getByRole('button', { name: /gerar diagnóstico/i })
    await user.click(submitBtn)

    // After submit, the form is replaced with ScanLoading
    expect(screen.queryByRole('button', { name: /gerar diagnóstico/i })).not.toBeInTheDocument()
    // ScanLoading renders a progressbar
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 7. Accessibility — axe-core zero violations
// ---------------------------------------------------------------------------

describe('ScanForm — Accessibility', () => {
  it('has no critical or serious a11y violations on step 1', async () => {
    const { container } = renderForm()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no critical or serious a11y violations on step 5', async () => {
    const { container } = renderForm()
    const user = userEvent.setup()

    // Navigate to step 5
    await navigateToStep(user, 5)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ---------------------------------------------------------------------------
// 8. Step validation — sector must be selected before advancing
// ---------------------------------------------------------------------------

describe('ScanForm — Step 1 Validation', () => {
  it('does NOT advance from step 1 when no sector is selected', async () => {
    renderForm()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /next/i }))
    // Should still be on step 1
    expect(screen.getByTestId('step-1')).toBeInTheDocument()
  })

  it('advances from step 1 after selecting a sector', async () => {
    renderForm()
    const user = userEvent.setup()

    await fillStep1(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByTestId('step-2')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 9. Step validation — business info required fields
// ---------------------------------------------------------------------------

describe('ScanForm — Step 2 Validation', () => {
  it('does NOT advance from step 2 when required fields are empty', async () => {
    renderForm()
    const user = userEvent.setup()

    await navigateToStep(user, 2)
    expect(screen.getByTestId('step-2')).toBeInTheDocument()

    // Try to advance without filling fields
    await user.click(screen.getByRole('button', { name: /next/i }))
    // Should still be on step 2
    expect(screen.getByTestId('step-2')).toBeInTheDocument()
  })

  it('shows error messages for empty required fields on step 2', async () => {
    renderForm()
    const user = userEvent.setup()

    await navigateToStep(user, 2)
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByText(/nome da empresa é obrigatório/i)).toBeInTheDocument()
    expect(screen.getByText(/tamanho da empresa é obrigatório/i)).toBeInTheDocument()
    expect(screen.getByText(/maturidade tecnológica é obrigatória/i)).toBeInTheDocument()
  })

  it('advances from step 2 after filling required fields', async () => {
    renderForm()
    const user = userEvent.setup()

    await navigateToStep(user, 2)
    await fillStep2(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByTestId('step-3')).toBeInTheDocument()
  })

  it('clears errors when navigating back from step 2', async () => {
    renderForm()
    const user = userEvent.setup()

    await navigateToStep(user, 2)
    // Trigger errors
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText(/nome da empresa é obrigatório/i)).toBeInTheDocument()

    // Go back
    await user.click(screen.getByRole('button', { name: /back/i }))
    // Come back to step 2
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Errors should be cleared
    expect(screen.queryByText(/nome da empresa é obrigatório/i)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 10. Integration — sector selection updates ScanForm state
// ---------------------------------------------------------------------------

describe('ScanForm — Sector Selection Integration', () => {
  it('sector selection on step 1 updates internal state', async () => {
    renderForm()
    const user = userEvent.setup()

    // Select a sector
    await user.click(screen.getByText('Sector 1'))
    const card = screen.getByText('Sector 1').closest('[role="button"]')
    expect(card).toHaveAttribute('aria-pressed', 'true')

    // Navigate away and back
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /back/i }))

    // Selection should be preserved
    const cardAfter = screen.getByText('Sector 1').closest('[role="button"]')
    expect(cardAfter).toHaveAttribute('aria-pressed', 'true')
  })
})
