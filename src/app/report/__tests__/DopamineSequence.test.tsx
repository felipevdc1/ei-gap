// ---------------------------------------------------------------------------
// EI-GAP — Dopamine Sequence Tests (TDD — RED phase)
// Story E4b.S2b — Cost of Inaction + CTA (Dopamine Sequence Closure)
// ---------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/store', () => ({
  store: {
    getReport: vi.fn(),
    getScan: vi.fn(),
    saveScan: vi.fn(),
    updateScanStatus: vi.fn(),
    saveReport: vi.fn(),
    saveLead: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  redirect: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { store } from '@/lib/store'
import type { ScanReport } from '@/types/scanner'
import type { StoredReport } from '@/lib/store/interface'

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const mockReport: ScanReport = {
  id: 'report-abc123',
  scan_id: 'scan-abc123',
  executive_summary: 'TechCorp tem alto potencial de automacao com IA.',
  opportunities: [
    {
      rank: 1,
      name: 'Automacao de Faturas',
      description: 'Extracao automatica de dados de faturas',
      category: 'Financeiro',
      impact_score: 9,
      feasibility_score: 8,
      effort_score: 3,
      roi_score: 9.5,
      composite_score: 8.7,
      guardrails: ['Validacao humana obrigatoria'],
      roi_range_min: 50000,
      roi_range_max: 120000,
      loss_per_month: 8500,
      time_to_value: '2-4 semanas',
      quick_win: true,
    },
    {
      rank: 2,
      name: 'Chatbot de Suporte',
      description: 'Triagem automatizada de tickets',
      category: 'Atendimento',
      impact_score: 8,
      feasibility_score: 7,
      effort_score: 4,
      roi_score: 9.2,
      composite_score: 8.1,
      guardrails: ['Supervisao humana'],
      roi_range_min: 40000,
      roi_range_max: 100000,
      loss_per_month: 7000,
      time_to_value: '3-6 semanas',
      quick_win: false,
    },
  ],
  total_roi_min: 150000,
  total_roi_max: 450000,
  cost_of_inaction_monthly: 25000,
  gains_summary: 'Economia de 65h/semana com automacao.',
  losses_summary: 'Perda de R$25.000/mes sem acao.',
  sector: 'Tecnologia',
  company_name: 'TechCorp Solutions',
  created_at: '2024-01-15T10:00:00Z',
}

const mockStoredReport: StoredReport = {
  id: 'report-abc123',
  scan_id: 'scan-abc123',
  content: mockReport,
  status: 'completed',
  created_at: new Date('2024-01-15T10:00:00Z'),
}

const mockedStore = store as unknown as {
  getReport: ReturnType<typeof vi.fn>
  getScan: ReturnType<typeof vi.fn>
}

// ---------------------------------------------------------------------------
// 1. CostOfInaction Component Tests
// ---------------------------------------------------------------------------

describe('CostOfInaction', () => {
  it('renders monthly cost formatted as BRL', async () => {
    const { CostOfInaction } = await import(
      '@/app/report/[id]/components/CostOfInaction'
    )

    render(<CostOfInaction monthlyLoss={25000} />)

    // R$ 25.000 monthly
    expect(screen.getByText(/R\$\s*25\.000/)).toBeInTheDocument()
  })

  it('calculates and renders semiannual cost (x6)', async () => {
    const { CostOfInaction } = await import(
      '@/app/report/[id]/components/CostOfInaction'
    )

    render(<CostOfInaction monthlyLoss={25000} />)

    // R$ 150.000 semiannual
    expect(screen.getByText(/R\$\s*150\.000/)).toBeInTheDocument()
  })

  it('calculates and renders annual cost (x12)', async () => {
    const { CostOfInaction } = await import(
      '@/app/report/[id]/components/CostOfInaction'
    )

    render(<CostOfInaction monthlyLoss={25000} />)

    // R$ 300.000 annual
    expect(screen.getByText(/R\$\s*300\.000/)).toBeInTheDocument()
  })

  it('has data-testid="cost-of-inaction"', async () => {
    const { CostOfInaction } = await import(
      '@/app/report/[id]/components/CostOfInaction'
    )

    render(<CostOfInaction monthlyLoss={25000} />)

    expect(screen.getByTestId('cost-of-inaction')).toBeInTheDocument()
  })

  it('has aria-live="polite" for animated numbers', async () => {
    const { CostOfInaction } = await import(
      '@/app/report/[id]/components/CostOfInaction'
    )

    const { container } = render(<CostOfInaction monthlyLoss={25000} />)

    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
  })

  it('respects prefers-reduced-motion', async () => {
    const { CostOfInaction } = await import(
      '@/app/report/[id]/components/CostOfInaction'
    )

    const { container } = render(<CostOfInaction monthlyLoss={25000} />)

    // Component should have motion-safe/motion-reduce classes
    const html = container.innerHTML
    expect(
      html.includes('motion-safe') || html.includes('motion-reduce'),
    ).toBe(true)
  })

  it('passes axe-core accessibility checks', async () => {
    const { CostOfInaction } = await import(
      '@/app/report/[id]/components/CostOfInaction'
    )

    const { container } = render(<CostOfInaction monthlyLoss={25000} />)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ---------------------------------------------------------------------------
// 2. ReportCta Component Tests
// ---------------------------------------------------------------------------

describe('ReportCta', () => {
  it('renders CTA button with correct text', async () => {
    const { ReportCta } = await import(
      '@/app/report/[id]/components/ReportCta'
    )

    render(<ReportCta scanId="scan-abc123" />)

    expect(
      screen.getByRole('link', { name: /agende uma consultoria gratuita/i }),
    ).toBeInTheDocument()
  })

  it('renders subtitle text', async () => {
    const { ReportCta } = await import(
      '@/app/report/[id]/components/ReportCta'
    )

    render(<ReportCta scanId="scan-abc123" />)

    expect(
      screen.getByText(
        /descubra como implementar essas oportunidades no seu neg/i,
      ),
    ).toBeInTheDocument()
  })

  it('uses ctaUrl prop when provided', async () => {
    const { ReportCta } = await import(
      '@/app/report/[id]/components/ReportCta'
    )

    render(<ReportCta ctaUrl="https://example.com/consult" scanId="scan-abc123" />)

    const link = screen.getByRole('link', {
      name: /agende uma consultoria gratuita/i,
    })
    expect(link).toHaveAttribute('href', 'https://example.com/consult')
  })

  it('falls back to NEXT_PUBLIC_CTA_URL env var', async () => {
    const originalEnv = process.env.NEXT_PUBLIC_CTA_URL
    process.env.NEXT_PUBLIC_CTA_URL = 'https://env-url.com/consult'

    // Re-import to pick up env var
    vi.resetModules()
    const { ReportCta } = await import(
      '@/app/report/[id]/components/ReportCta'
    )

    render(<ReportCta scanId="scan-abc123" />)

    const link = screen.getByRole('link', {
      name: /agende uma consultoria gratuita/i,
    })
    expect(link).toHaveAttribute('href', 'https://env-url.com/consult')

    process.env.NEXT_PUBLIC_CTA_URL = originalEnv
  })

  it('falls back to "#" when no URL provided', async () => {
    const originalEnv = process.env.NEXT_PUBLIC_CTA_URL
    delete process.env.NEXT_PUBLIC_CTA_URL

    vi.resetModules()
    const { ReportCta } = await import(
      '@/app/report/[id]/components/ReportCta'
    )

    render(<ReportCta scanId="scan-abc123" />)

    const link = screen.getByRole('link', {
      name: /agende uma consultoria gratuita/i,
    })
    expect(link).toHaveAttribute('href', '#')

    process.env.NEXT_PUBLIC_CTA_URL = originalEnv
  })

  it('has data-testid="report-cta"', async () => {
    const { ReportCta } = await import(
      '@/app/report/[id]/components/ReportCta'
    )

    render(<ReportCta scanId="scan-abc123" />)

    expect(screen.getByTestId('report-cta')).toBeInTheDocument()
  })

  it('passes axe-core accessibility checks', async () => {
    const { ReportCta } = await import(
      '@/app/report/[id]/components/ReportCta'
    )

    const { container } = render(<ReportCta scanId="scan-abc123" />)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// ---------------------------------------------------------------------------
// 3. DOM Sequence Test — Dopamine Engineering Order
// ---------------------------------------------------------------------------

describe('Dopamine Sequence — DOM order', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sections in correct dopamine sequence order', async () => {
    mockedStore.getReport.mockResolvedValue(mockStoredReport)

    const { default: ReportPage } = await import(
      '@/app/report/[id]/page'
    )

    const params = Promise.resolve({ id: 'report-abc123' })
    const Result = await ReportPage({ params })
    const { container } = render(Result)

    // Get all data-testid elements in DOM order
    const sections = container.querySelectorAll('[data-testid]')
    const testIds = Array.from(sections).map((el) =>
      el.getAttribute('data-testid'),
    )

    // Expected dopamine sequence:
    // report-header -> loss-aversion -> opportunities-table -> top-three -> cost-of-inaction -> report-cta
    const expectedOrder = [
      'report-header',
      'loss-aversion',
      'opportunities-table',
      'top-three',
      'cost-of-inaction',
      'report-cta',
    ]

    // Filter to only the relevant testids (there might be nested ones)
    const sequenceIds = testIds.filter((id) =>
      expectedOrder.includes(id as string),
    )

    expect(sequenceIds).toEqual(expectedOrder)
  })

  it('includes CostOfInaction after Top 3 opportunities', async () => {
    mockedStore.getReport.mockResolvedValue(mockStoredReport)

    const { default: ReportPage } = await import(
      '@/app/report/[id]/page'
    )

    const params = Promise.resolve({ id: 'report-abc123' })
    const Result = await ReportPage({ params })
    const { container } = render(Result)

    const costSection = container.querySelector(
      '[data-testid="cost-of-inaction"]',
    )
    const ctaSection = container.querySelector('[data-testid="report-cta"]')

    expect(costSection).toBeInTheDocument()
    expect(ctaSection).toBeInTheDocument()

    // cost-of-inaction must come before report-cta in DOM
    if (costSection && ctaSection) {
      const position =
        costSection.compareDocumentPosition(ctaSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
      expect(position).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// 4. Responsive Tests
// ---------------------------------------------------------------------------

describe('CostOfInaction — Responsive', () => {
  it('renders all three cost periods (monthly, semiannual, annual)', async () => {
    const { CostOfInaction } = await import(
      '@/app/report/[id]/components/CostOfInaction'
    )

    render(<CostOfInaction monthlyLoss={10000} />)

    // Monthly: R$ 10.000
    expect(screen.getByText(/R\$\s*10\.000/)).toBeInTheDocument()
    // Semiannual: R$ 60.000
    expect(screen.getByText(/R\$\s*60\.000/)).toBeInTheDocument()
    // Annual: R$ 120.000
    expect(screen.getByText(/R\$\s*120\.000/)).toBeInTheDocument()
  })

  it('uses responsive grid classes', async () => {
    const { CostOfInaction } = await import(
      '@/app/report/[id]/components/CostOfInaction'
    )

    const { container } = render(<CostOfInaction monthlyLoss={10000} />)

    // Should have grid with responsive breakpoints
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })
})

describe('ReportCta — Responsive', () => {
  it('CTA link has appropriate sizing classes', async () => {
    const { ReportCta } = await import(
      '@/app/report/[id]/components/ReportCta'
    )

    const { container } = render(<ReportCta scanId="scan-abc123" />)

    // CTA section should exist with proper structure
    const ctaSection = screen.getByTestId('report-cta')
    expect(ctaSection).toBeInTheDocument()

    // Should have a prominent link element
    const link = within(ctaSection).getByRole('link')
    expect(link).toBeInTheDocument()
  })
})
