// ---------------------------------------------------------------------------
// EI-GAP — Report Page (Server Component)
// Story E4b.S1 — Report Page Structure + States
// ---------------------------------------------------------------------------
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { store } from '@/lib/store'
import { ReportHeader } from './components/ReportHeader'
import { LossAversionSection } from './components/LossAversionSection'
import { OpportunitiesTable } from './components/OpportunitiesTable'
import { TopThreeDeepDive } from './components/TopThreeDeepDive'
import { CostOfInaction } from './components/CostOfInaction'
import { ReportCta } from './components/ReportCta'

// ---------------------------------------------------------------------------
// Dynamic OG metadata per report
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const storedReport = await store.getReport(id)

  if (!storedReport) {
    return {
      title: 'Diagnóstico | EI-GAP',
    }
  }

  const report = storedReport.content
  const roiMin = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(report.total_roi_min)
  const roiMax = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(report.total_roi_max)

  return {
    title: `Diagnóstico ${report.company_name} | EI-GAP`,
    description: `Setor: ${report.sector} | ROI Estimado: ${roiMin} — ${roiMax}`,
    openGraph: {
      title: `Diagnóstico IA — ${report.company_name}`,
      description: `Setor: ${report.sector} | ROI Estimado: ${roiMin} — ${roiMax}`,
      type: 'article',
    },
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params

  // Try to get the completed report
  const storedReport = await store.getReport(id)

  if (storedReport) {
    const report = storedReport.content

    return (
      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <ReportHeader report={report} />

        {/* Dopamine Sequence: ROI header -> Loss Aversion -> Top 10 -> Top 3 -> Cost of Inaction -> CTA */}
        <div className="space-y-6">
          {/* E4b.S2a — Loss Aversion Section */}
          <LossAversionSection
            gains_summary={report.gains_summary}
            losses_summary={report.losses_summary}
            total_roi_min={report.total_roi_min}
            total_roi_max={report.total_roi_max}
            cost_of_inaction_monthly={report.cost_of_inaction_monthly}
          />

          {/* E4b.S2a — Opportunities Table (all 10) */}
          <OpportunitiesTable opportunities={report.opportunities} />

          {/* E4b.S2a — Top 3 Deep Dive */}
          <TopThreeDeepDive opportunities={report.opportunities} />

          {/* E4b.S2b — Cost of Inaction + CTA */}
          <CostOfInaction monthlyLoss={report.cost_of_inaction_monthly} />
          <ReportCta scanId={id} />
        </div>
      </main>
    )
  }

  // Check if scan is still processing
  const scan = await store.getScan(id)

  if (scan && scan.status === 'processing') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Aguarde...
        </h1>
        <p className="text-lg text-gray-600">
          Seu diagnóstico está sendo gerado...
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Isso pode levar alguns segundos.
        </p>
      </main>
    )
  }

  // Neither report nor processing scan found
  notFound()
}
