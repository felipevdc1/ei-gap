import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { SectorQuestionsStep } from '../components/SectorQuestionsStep'
import { getSectorProfiles } from '@/lib/data/loader'

expect.extend(matchers)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const { sectors, generic } = getSectorProfiles()

const ECOMMERCE_QUESTIONS = [
  'Quantos pedidos processam por dia/semana?',
  'Quantos % de atendimento sao perguntas repetitivas?',
  'Como gerenciam estoque entre canais (loja + marketplace)?',
  'Como criam descricoes e fotos de novos produtos?',
  'Qual tempo medio de resposta ao cliente?',
]

const SAAS_QUESTIONS = [
  'Quantos tickets de suporte recebem por semana?',
  'Qual % de tickets sao resolvidos com FAQ existente?',
  'Como funciona o processo de onboarding?',
  'Qual a taxa de churn mensal?',
  'Como priorizam backlog de features?',
]

function renderStep(
  overrides: {
    sectorSlug?: string
    answers?: Record<string, string>
    onChange?: (answers: Record<string, string>) => void
  } = {},
) {
  const onChange = overrides.onChange ?? vi.fn()
  const sectorSlug = overrides.sectorSlug ?? 'ecommerce'
  const answers = overrides.answers ?? {}
  return {
    ...render(
      <SectorQuestionsStep
        sectorSlug={sectorSlug}
        answers={answers}
        onChange={onChange}
        sectors={sectors}
        generic={generic}
      />,
    ),
    onChange,
  }
}

// ---------------------------------------------------------------------------
// 1. Renders sector-specific questions
// ---------------------------------------------------------------------------

describe('SectorQuestionsStep — Rendering', () => {
  it('renders 5 questions for ecommerce sector', () => {
    renderStep({ sectorSlug: 'ecommerce' })
    for (const q of ECOMMERCE_QUESTIONS) {
      expect(screen.getByLabelText(q)).toBeInTheDocument()
    }
  })

  it('renders 5 questions for saas sector', () => {
    renderStep({ sectorSlug: 'saas' })
    for (const q of SAAS_QUESTIONS) {
      expect(screen.getByLabelText(q)).toBeInTheDocument()
    }
  })

  it('renders textareas for each question', () => {
    renderStep({ sectorSlug: 'ecommerce' })
    const textareas = screen.getAllByRole('textbox')
    expect(textareas).toHaveLength(5)
  })

  it('renders generic questions for unknown sector', () => {
    renderStep({ sectorSlug: 'nonexistent-sector' })
    // Should fall back to generic universal_questions
    expect(screen.getByLabelText(/Qual o setor e tamanho da empresa/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 2. Questions change when sector changes
// ---------------------------------------------------------------------------

describe('SectorQuestionsStep — Sector Change', () => {
  it('questions change when selected sector changes', () => {
    const { rerender, onChange } = renderStep({ sectorSlug: 'ecommerce' })

    // Verify ecommerce questions
    expect(screen.getByLabelText(ECOMMERCE_QUESTIONS[0])).toBeInTheDocument()

    // Re-render with saas sector
    rerender(
      <SectorQuestionsStep
        sectorSlug="saas"
        answers={{}}
        onChange={onChange}
        sectors={sectors}
        generic={generic}
      />,
    )

    // Verify saas questions are now shown
    expect(screen.getByLabelText(SAAS_QUESTIONS[0])).toBeInTheDocument()
    // Ecommerce questions should be gone
    expect(screen.queryByLabelText(ECOMMERCE_QUESTIONS[0])).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 3. Character counter (500 max)
// ---------------------------------------------------------------------------

describe('SectorQuestionsStep — Character Counter', () => {
  it('shows character counter for each textarea', () => {
    renderStep({ sectorSlug: 'ecommerce' })
    const counters = screen.getAllByText(/0\s*\/\s*500/)
    expect(counters).toHaveLength(5)
  })

  it('updates character counter when typing', async () => {
    const { onChange } = renderStep({
      sectorSlug: 'ecommerce',
      answers: { q0: 'Hello' },
    })
    // Should show 5/500 for the first question
    expect(screen.getByText(/5\s*\/\s*500/)).toBeInTheDocument()
  })

  it('limits textarea to 500 characters via maxLength', () => {
    renderStep({ sectorSlug: 'ecommerce' })
    const textareas = screen.getAllByRole('textbox')
    for (const ta of textareas) {
      expect(ta).toHaveAttribute('maxLength', '500')
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Data binding — onChange
// ---------------------------------------------------------------------------

describe('SectorQuestionsStep — Data Binding', () => {
  it('calls onChange when typing in a textarea', async () => {
    const onChange = vi.fn()
    renderStep({ sectorSlug: 'ecommerce', onChange })
    const user = userEvent.setup()

    const firstTextarea = screen.getAllByRole('textbox')[0]
    await user.type(firstTextarea, 'A')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ q0: 'A' }),
    )
  })

  it('preserves existing answers when typing in a different field', async () => {
    const onChange = vi.fn()
    renderStep({
      sectorSlug: 'ecommerce',
      answers: { q0: 'Existing answer' },
      onChange,
    })
    const user = userEvent.setup()

    const secondTextarea = screen.getAllByRole('textbox')[1]
    await user.type(secondTextarea, 'B')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        q0: 'Existing answer',
        q1: 'B',
      }),
    )
  })

  it('displays pre-filled answers', () => {
    renderStep({
      sectorSlug: 'ecommerce',
      answers: { q0: 'My answer', q2: 'Another answer' },
    })
    const textareas = screen.getAllByRole('textbox')
    expect(textareas[0]).toHaveValue('My answer')
    expect(textareas[1]).toHaveValue('')
    expect(textareas[2]).toHaveValue('Another answer')
  })
})

// ---------------------------------------------------------------------------
// 5. Labels and aria attributes
// ---------------------------------------------------------------------------

describe('SectorQuestionsStep — Labels & Aria', () => {
  it('each textarea has an associated label', () => {
    renderStep({ sectorSlug: 'ecommerce' })
    for (const q of ECOMMERCE_QUESTIONS) {
      const textarea = screen.getByLabelText(q)
      expect(textarea).toHaveAttribute('id')
    }
  })

  it('textareas have aria-describedby pointing to counter', () => {
    renderStep({ sectorSlug: 'ecommerce' })
    const textareas = screen.getAllByRole('textbox')
    for (const ta of textareas) {
      expect(ta).toHaveAttribute('aria-describedby')
    }
  })
})

// ---------------------------------------------------------------------------
// 6. Accessibility — axe-core
// ---------------------------------------------------------------------------

describe('SectorQuestionsStep — Accessibility', () => {
  it('has zero a11y violations with empty form', async () => {
    const { container } = renderStep()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero a11y violations with filled answers', async () => {
    const { container } = renderStep({
      sectorSlug: 'ecommerce',
      answers: { q0: 'Answer 1', q1: 'Answer 2', q2: 'Answer 3', q3: 'Answer 4', q4: 'Answer 5' },
    })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
