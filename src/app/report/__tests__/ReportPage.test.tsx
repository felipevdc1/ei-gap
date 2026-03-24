// ---------------------------------------------------------------------------
// EI-GAP — ReportPage Tests (TDD — RED phase)
// Story E4b.S1 — Report Page Structure + States
// ---------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// We mock the store module so Server Component logic can be tested
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

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  redirect: vi.fn(),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { store } from '@/lib/store'
import type { ScanReport } from '@/types/scanner'
import type { StoredReport, StoredScan } from '@/lib/store/interface'

// ---------------------------------------------------------------------------
// Fixture: a complete ScanReport matching the real type
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

const mockStoredReport: StoredReport = {
  id: 'report-abc123',
  scan_id: 'scan-abc123',
  content: mockReport,
  status: 'completed',
  created_at: new Date('2024-01-15T10:00:00Z'),
}

const mockProcessingScan: StoredScan = {
  id: 'scan-processing',
  sector: 'Tecnologia',
  company_name: 'TechCorp',
  form_data: {
    sector: 'Tecnologia',
    company_name: 'TechCorp',
    company_size: '51-200',
    tech_maturity: 'medium',
    sector_answers: {},
    processes: [],
  },
  status: 'processing',
  created_at: new Date(),
}

const mockedStore = store as unknown as {
  getReport: ReturnType<typeof vi.fn>
  getScan: ReturnType<typeof vi.fn>
}

describe('ReportPage — Server Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders report content when report exists (200 state)', async () => {
    mockedStore.getReport.mockResolvedValue(mockStoredReport)

    const { default: ReportPage } = await import(
      '@/app/report/[id]/page'
    )

    const params = Promise.resolve({ id: 'report-abc123' })
    const Result = await ReportPage({ params })
    render(Result)

    expect(screen.getByText('TechCorp Solutions')).toBeInTheDocument()
    expect(screen.getByText('Tecnologia')).toBeInTheDocument()
    // ROI total should appear (may appear in multiple sections)
    const roiMin = screen.getAllByText(/R\$\s*150\.000/)
    const roiMax = screen.getAllByText(/R\$\s*450\.000/)
    expect(roiMin.length).toBeGreaterThanOrEqual(1)
    expect(roiMax.length).toBeGreaterThanOrEqual(1)
  })

  it('renders loading state when scan is processing (202 state)', async () => {
    mockedStore.getReport.mockResolvedValue(null)
    mockedStore.getScan.mockResolvedValue(mockProcessingScan)

    const { default: ReportPage } = await import(
      '@/app/report/[id]/page'
    )

    const params = Promise.resolve({ id: 'scan-processing' })
    const Result = await ReportPage({ params })
    render(Result)

    expect(
      screen.getByText(/diagnóstico está sendo gerado/i),
    ).toBeInTheDocument()
  })

  it('renders 404 state when report and scan do not exist', async () => {
    mockedStore.getReport.mockResolvedValue(null)
    mockedStore.getScan.mockResolvedValue(null)

    const { default: ReportPage } = await import(
      '@/app/report/[id]/page'
    )

    const params = Promise.resolve({ id: 'nonexistent-id' })

    await expect(async () => {
      const Result = await ReportPage({ params })
      render(Result)
    }).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
