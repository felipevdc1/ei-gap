import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { ProcessMappingStep } from '../components/ProcessMappingStep'
import type { ScanFormProcess } from '../components/ProcessMappingStep'

expect.extend(matchers)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProcess(overrides: Partial<ScanFormProcess> = {}): ScanFormProcess {
  return {
    name: 'Atendimento ao cliente',
    time_per_week: 10,
    pain_level: 3,
    ...overrides,
  }
}

function makeProcesses(count: number): ScanFormProcess[] {
  return Array.from({ length: count }, (_, i) =>
    makeProcess({ name: `Processo ${i + 1}`, time_per_week: (i + 1) * 5, pain_level: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5 }),
  )
}

function renderStep(
  overrides: {
    processes?: ScanFormProcess[]
    onChange?: (processes: ScanFormProcess[]) => void
    errors?: string
  } = {},
) {
  const onChange = overrides.onChange ?? vi.fn()
  const processes = overrides.processes ?? []
  const errors = overrides.errors
  return {
    ...render(
      <ProcessMappingStep
        processes={processes}
        onChange={onChange}
        errors={errors}
      />,
    ),
    onChange,
  }
}

// ---------------------------------------------------------------------------
// 1. Renders process list
// ---------------------------------------------------------------------------

describe('ProcessMappingStep — Rendering', () => {
  it('renders an empty state with add button', () => {
    renderStep()
    expect(screen.getByRole('button', { name: /adicionar processo/i })).toBeInTheDocument()
  })

  it('renders existing processes', () => {
    renderStep({ processes: makeProcesses(3) })
    expect(screen.getByDisplayValue('Processo 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Processo 2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Processo 3')).toBeInTheDocument()
  })

  it('renders name input, time input, and pain level for each process', () => {
    renderStep({ processes: [makeProcess()] })
    // name input
    expect(screen.getByDisplayValue('Atendimento ao cliente')).toBeInTheDocument()
    // time input
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    // pain level select/radio
    expect(screen.getByLabelText(/n[íi]vel de dor/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 2. Add / Remove processes
// ---------------------------------------------------------------------------

describe('ProcessMappingStep — Add / Remove', () => {
  it('adds a new empty process when clicking add', async () => {
    const onChange = vi.fn()
    renderStep({ processes: [], onChange })
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /adicionar processo/i }))

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: '', time_per_week: 0, pain_level: 1 }),
    ])
  })

  it('removes a process when clicking remove', async () => {
    const onChange = vi.fn()
    const processes = makeProcesses(4)
    renderStep({ processes, onChange })
    const user = userEvent.setup()

    const removeButtons = screen.getAllByRole('button', { name: /remover processo/i })
    await user.click(removeButtons[1]) // Remove second process

    expect(onChange).toHaveBeenCalledWith(
      expect.not.arrayContaining([
        expect.objectContaining({ name: 'Processo 2' }),
      ]),
    )
    // Should have 3 processes
    const callArg = onChange.mock.calls[0][0]
    expect(callArg).toHaveLength(3)
  })

  it('disables add button when at maximum (10 processes)', () => {
    renderStep({ processes: makeProcesses(10) })
    const addBtn = screen.getByRole('button', { name: /adicionar processo/i })
    expect(addBtn).toBeDisabled()
  })

  it('allows adding when below maximum', () => {
    renderStep({ processes: makeProcesses(9) })
    const addBtn = screen.getByRole('button', { name: /adicionar processo/i })
    expect(addBtn).not.toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// 3. Data binding — onChange
// ---------------------------------------------------------------------------

describe('ProcessMappingStep — Data Binding', () => {
  it('calls onChange when process name is typed', async () => {
    const onChange = vi.fn()
    renderStep({
      processes: [makeProcess({ name: '' })],
      onChange,
    })
    const user = userEvent.setup()

    const nameInput = screen.getByLabelText(/nome do processo/i)
    await user.type(nameInput, 'A')

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'A' }),
    ])
  })

  it('calls onChange when time_per_week is changed', async () => {
    const onChange = vi.fn()
    renderStep({
      processes: [makeProcess({ time_per_week: 0 })],
      onChange,
    })
    const user = userEvent.setup()

    const timeInput = screen.getByLabelText(/horas.*semana/i)
    await user.type(timeInput, '5')

    // userEvent.type fires onChange per keystroke on controlled input
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ time_per_week: 5 }),
    ])
  })

  it('calls onChange when pain level is changed', async () => {
    const onChange = vi.fn()
    renderStep({
      processes: [makeProcess({ pain_level: 1 })],
      onChange,
    })
    const user = userEvent.setup()

    const painSelect = screen.getByLabelText(/n[íi]vel de dor/i)
    await user.selectOptions(painSelect, '4')

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ pain_level: 4 }),
    ])
  })
})

// ---------------------------------------------------------------------------
// 4. Pain level labels
// ---------------------------------------------------------------------------

describe('ProcessMappingStep — Pain Level Labels', () => {
  it('shows pain level options from 1 (Baixa) to 5 (Crítica)', () => {
    renderStep({ processes: [makeProcess()] })
    const painSelect = screen.getByLabelText(/n[íi]vel de dor/i)
    const options = within(painSelect).getAllByRole('option')
    // 5 options (no placeholder for pain level since it defaults to 1)
    expect(options.length).toBeGreaterThanOrEqual(5)
    expect(screen.getByText(/baixa/i)).toBeInTheDocument()
    expect(screen.getByText(/cr[íi]tica/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 5. Validation error display
// ---------------------------------------------------------------------------

describe('ProcessMappingStep — Error Display', () => {
  it('displays error message when provided', () => {
    renderStep({ errors: 'Mínimo de 3 processos obrigatório' })
    const error = screen.getByText('Mínimo de 3 processos obrigatório')
    expect(error).toBeInTheDocument()
    expect(error).toHaveAttribute('role', 'alert')
  })

  it('does not display error when not provided', () => {
    renderStep()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 6. Process name character limit
// ---------------------------------------------------------------------------

describe('ProcessMappingStep — Name Character Limit', () => {
  it('limits process name to 200 characters', () => {
    renderStep({ processes: [makeProcess()] })
    const nameInput = screen.getByDisplayValue('Atendimento ao cliente')
    expect(nameInput).toHaveAttribute('maxLength', '200')
  })
})

// ---------------------------------------------------------------------------
// 7. Accessibility — axe-core
// ---------------------------------------------------------------------------

describe('ProcessMappingStep — Accessibility', () => {
  it('has zero a11y violations with empty state', async () => {
    const { container } = renderStep()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero a11y violations with processes', async () => {
    const { container } = renderStep({ processes: makeProcesses(3) })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero a11y violations with error message', async () => {
    const { container } = renderStep({
      errors: 'Mínimo de 3 processos',
      processes: [makeProcess()],
    })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
