// ---------------------------------------------------------------------------
// EI-GAP — Report States Tests (TDD — RED phase)
// Story E4b.S1 — ReportHeader + not-found + error boundary
// ---------------------------------------------------------------------------
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import type { ScanReport } from '@/types/scanner'

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------
const mockReport: ScanReport = {
  id: 'report-abc123',
  scan_id: 'scan-abc123',
  executive_summary: 'TechCorp tem alto potencial de automação com IA.',
  opportunities: [
    {
      rank: 1,
      name: 'Automação de Faturas',
      description: 'Extração automática de dados de faturas',
      category: 'Financeiro',
      impact_score: 9,
      feasibility_score: 8,
      effort_score: 3,
      roi_score: 9.5,
      composite_score: 8.7,
      guardrails: ['Validação humana obrigatória'],
      roi_range_min: 50000,
      roi_range_max: 120000,
      loss_per_month: 8500,
      time_to_value: '2-4 semanas',
      quick_win: true,
    },
  ],
  total_roi_min: 150000,
  total_roi_max: 450000,
  cost_of_inaction_monthly: 25000,
  gains_summary: 'Economia de 65h/semana com automação.',
  losses_summary: 'Perda de R$25.000/mês sem ação.',
  sector: 'Tecnologia',
  company_name: 'TechCorp Solutions',
  created_at: '2024-01-15T10:00:00Z',
}

// ---------------------------------------------------------------------------
// ReportHeader component tests
// ---------------------------------------------------------------------------
describe('ReportHeader', () => {
  it('renders company name as heading', async () => {
    const { ReportHeader } = await import(
      '@/app/report/[id]/components/ReportHeader'
    )

    render(<ReportHeader report={mockReport} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('TechCorp Solutions')
  })

  it('renders sector badge', async () => {
    const { ReportHeader } = await import(
      '@/app/report/[id]/components/ReportHeader'
    )

    render(<ReportHeader report={mockReport} />)

    expect(screen.getByText('Tecnologia')).toBeInTheDocument()
  })

  it('renders ROI total range in large text', async () => {
    const { ReportHeader } = await import(
      '@/app/report/[id]/components/ReportHeader'
    )

    render(<ReportHeader report={mockReport} />)

    expect(screen.getByText(/R\$\s*150\.000/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*450\.000/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// NotFound page tests
// ---------------------------------------------------------------------------
describe('Report NotFound page', () => {
  it('renders "Diagnóstico não encontrado" message', async () => {
    const { default: NotFound } = await import(
      '@/app/report/[id]/not-found'
    )

    render(<NotFound />)

    expect(
      screen.getByText(/diagnóstico não encontrado/i),
    ).toBeInTheDocument()
  })

  it('has a link to /scan', async () => {
    const { default: NotFound } = await import(
      '@/app/report/[id]/not-found'
    )

    render(<NotFound />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/scan')
  })
})

// ---------------------------------------------------------------------------
// Error boundary tests
// ---------------------------------------------------------------------------
describe('Report Error Boundary', () => {
  it('renders friendly error message', async () => {
    const { default: ErrorBoundary } = await import(
      '@/app/report/[id]/error'
    )

    const mockReset = vi.fn()
    render(<ErrorBoundary error={new Error('Test error')} reset={mockReset} />)

    expect(
      screen.getByText(/ocorreu um erro/i),
    ).toBeInTheDocument()
    // Button with "Tente novamente" text
    expect(
      screen.getByRole('button', { name: /tente novamente/i }),
    ).toBeInTheDocument()
  })

  it('calls reset when retry button is clicked', async () => {
    const { default: ErrorBoundary } = await import(
      '@/app/report/[id]/error'
    )

    const mockReset = vi.fn()
    render(<ErrorBoundary error={new Error('Test error')} reset={mockReset} />)

    const retryButton = screen.getByRole('button')
    retryButton.click()
    expect(mockReset).toHaveBeenCalledOnce()
  })
})
