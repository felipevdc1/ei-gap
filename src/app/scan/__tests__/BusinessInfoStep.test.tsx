import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { BusinessInfoStep } from '../components/BusinessInfoStep'
import type { BusinessInfoData } from '../components/BusinessInfoStep'

expect.extend(matchers)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyData: BusinessInfoData = {
  company_name: '',
  company_size: '',
  tech_maturity: '',
  current_tools: '',
}

const validData: BusinessInfoData = {
  company_name: 'Acme Corp',
  company_size: '11-50',
  tech_maturity: 'medium',
  current_tools: 'Slack, Notion',
}

function renderStep(
  overrides: { data?: BusinessInfoData; onChange?: (data: BusinessInfoData) => void; errors?: Record<string, string> } = {},
) {
  const onChange = overrides.onChange ?? vi.fn()
  const data = overrides.data ?? emptyData
  const errors = overrides.errors ?? {}
  return {
    ...render(<BusinessInfoStep data={data} onChange={onChange} errors={errors} />),
    onChange,
  }
}

// ---------------------------------------------------------------------------
// 1. Renders all fields
// ---------------------------------------------------------------------------

describe('BusinessInfoStep — Rendering', () => {
  it('renders company name input', () => {
    renderStep()
    expect(screen.getByLabelText(/nome da empresa/i)).toBeInTheDocument()
  })

  it('renders company size select', () => {
    renderStep()
    expect(screen.getByLabelText(/tamanho/i)).toBeInTheDocument()
  })

  it('renders tech maturity select', () => {
    renderStep()
    expect(screen.getByLabelText(/maturidade tecnol/i)).toBeInTheDocument()
  })

  it('renders current tools textarea', () => {
    renderStep()
    expect(screen.getByLabelText(/ferramentas atuais/i)).toBeInTheDocument()
  })

  it('renders company size options', () => {
    renderStep()
    const select = screen.getByLabelText(/tamanho/i)
    const options = within(select).getAllByRole('option')
    // placeholder + 5 size options
    expect(options.length).toBeGreaterThanOrEqual(6)
    expect(screen.getByText('1-10')).toBeInTheDocument()
    expect(screen.getByText('11-50')).toBeInTheDocument()
    expect(screen.getByText('51-200')).toBeInTheDocument()
    expect(screen.getByText('201-500')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
  })

  it('renders tech maturity options', () => {
    renderStep()
    const select = screen.getByLabelText(/maturidade tecnol/i)
    const options = within(select).getAllByRole('option')
    // placeholder + 3 maturity options
    expect(options.length).toBeGreaterThanOrEqual(4)
    expect(screen.getByText('Baixa')).toBeInTheDocument()
    expect(screen.getByText('Média')).toBeInTheDocument()
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 2. Data binding — onChange
// ---------------------------------------------------------------------------

describe('BusinessInfoStep — Data Binding', () => {
  it('calls onChange when company name is typed', async () => {
    const { onChange } = renderStep()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/nome da empresa/i), 'A')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ company_name: 'A' }),
    )
  })

  it('calls onChange when company size is selected', async () => {
    const { onChange } = renderStep()
    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText(/tamanho/i), '51-200')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ company_size: '51-200' }),
    )
  })

  it('calls onChange when tech maturity is selected', async () => {
    const { onChange } = renderStep()
    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText(/maturidade tecnol/i), 'high')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tech_maturity: 'high' }),
    )
  })

  it('calls onChange when current tools is typed', async () => {
    const { onChange } = renderStep()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/ferramentas atuais/i), 'S')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ current_tools: 'S' }),
    )
  })

  it('displays pre-filled data correctly', () => {
    renderStep({ data: validData })
    expect(screen.getByLabelText(/nome da empresa/i)).toHaveValue('Acme Corp')
    expect(screen.getByLabelText(/tamanho/i)).toHaveValue('11-50')
    expect(screen.getByLabelText(/maturidade tecnol/i)).toHaveValue('medium')
    expect(screen.getByLabelText(/ferramentas atuais/i)).toHaveValue('Slack, Notion')
  })
})

// ---------------------------------------------------------------------------
// 3. Label association and required fields
// ---------------------------------------------------------------------------

describe('BusinessInfoStep — Labels & Required Fields', () => {
  it('all inputs have associated labels via htmlFor/id', () => {
    renderStep()
    const nameInput = screen.getByLabelText(/nome da empresa/i)
    expect(nameInput).toHaveAttribute('id')

    const sizeSelect = screen.getByLabelText(/tamanho/i)
    expect(sizeSelect).toHaveAttribute('id')

    const maturitySelect = screen.getByLabelText(/maturidade tecnol/i)
    expect(maturitySelect).toHaveAttribute('id')

    const toolsTextarea = screen.getByLabelText(/ferramentas atuais/i)
    expect(toolsTextarea).toHaveAttribute('id')
  })

  it('required fields have aria-required="true"', () => {
    renderStep()
    expect(screen.getByLabelText(/nome da empresa/i)).toHaveAttribute('aria-required', 'true')
    expect(screen.getByLabelText(/tamanho/i)).toHaveAttribute('aria-required', 'true')
    expect(screen.getByLabelText(/maturidade tecnol/i)).toHaveAttribute('aria-required', 'true')
  })

  it('current tools field is NOT required', () => {
    renderStep()
    expect(screen.getByLabelText(/ferramentas atuais/i)).not.toHaveAttribute('aria-required', 'true')
  })
})

// ---------------------------------------------------------------------------
// 4. Error messages
// ---------------------------------------------------------------------------

describe('BusinessInfoStep — Error Messages', () => {
  it('displays error message for company name when provided', () => {
    renderStep({ errors: { company_name: 'Nome da empresa é obrigatório' } })
    const error = screen.getByText('Nome da empresa é obrigatório')
    expect(error).toBeInTheDocument()
    expect(error).toHaveAttribute('role', 'alert')
  })

  it('error is linked to input via aria-describedby', () => {
    renderStep({ errors: { company_name: 'Nome da empresa é obrigatório' } })
    const input = screen.getByLabelText(/nome da empresa/i)
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    const errorEl = document.getElementById(errorId!)
    expect(errorEl).toHaveTextContent('Nome da empresa é obrigatório')
  })

  it('displays multiple errors simultaneously', () => {
    renderStep({
      errors: {
        company_name: 'Nome obrigatório',
        company_size: 'Tamanho obrigatório',
        tech_maturity: 'Maturidade obrigatória',
      },
    })
    expect(screen.getByText('Nome obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Tamanho obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Maturidade obrigatória')).toBeInTheDocument()
  })

  it('does not display error elements when no errors', () => {
    renderStep()
    const alerts = screen.queryAllByRole('alert')
    expect(alerts).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// 5. Accessibility — axe-core
// ---------------------------------------------------------------------------

describe('BusinessInfoStep — Accessibility', () => {
  it('has zero a11y violations with empty form', async () => {
    const { container } = renderStep()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero a11y violations with filled form', async () => {
    const { container } = renderStep({ data: validData })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has zero a11y violations with error messages', async () => {
    const { container } = renderStep({
      errors: {
        company_name: 'Campo obrigatório',
        company_size: 'Campo obrigatório',
      },
    })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
