// ---------------------------------------------------------------------------
// EI-GAP — ReportHeader Component
// Story E4b.S1 — Company name, sector badge, ROI total headline
// ---------------------------------------------------------------------------
import type { ScanReport } from '@/types/scanner'

interface ReportHeaderProps {
  report: ScanReport
}

/**
 * Formats a number as BRL currency without decimals.
 * e.g., 150000 -> "R$ 150.000"
 */
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function ReportHeader({ report }: ReportHeaderProps) {
  return (
    <header className="mb-8 space-y-4" data-testid="report-header">
      <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
        {report.company_name}
      </h1>

      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
        {report.sector}
      </span>

      {(report.total_roi_min > 0 || report.total_roi_max > 0) && (
        <div className="mt-4">
          <p className="text-sm text-gray-500">ROI Total Estimado</p>
          <p className="text-2xl font-bold text-green-700 md:text-3xl">
            {formatBRL(report.total_roi_min)} — {formatBRL(report.total_roi_max)}
          </p>
        </div>
      )}
    </header>
  )
}
