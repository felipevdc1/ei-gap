// ---------------------------------------------------------------------------
// EI-GAP — LossAversionSection Component
// Story E4b.S2a — GAINS vs LOSSES in 2 columns with animated numbers
// ---------------------------------------------------------------------------

interface LossAversionSectionProps {
  gains_summary: string
  losses_summary: string
  total_roi_min: number
  total_roi_max: number
  cost_of_inaction_monthly: number
}

/**
 * Formats a number as BRL currency without decimals.
 */
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function LossAversionSection({
  gains_summary,
  losses_summary,
  total_roi_min,
  total_roi_max,
  cost_of_inaction_monthly,
}: LossAversionSectionProps) {
  return (
    <section data-testid="loss-aversion" className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Ganhos vs Perdas
      </h2>

      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        aria-live="polite"
      >
        {/* --- Gains column --- */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <h3 className="mb-3 text-lg font-semibold text-green-800">
            O que voc&ecirc; ganha
          </h3>
          <p className="mb-4 text-sm text-green-700">{gains_summary}</p>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-green-600">
              ROI Estimado
            </p>
            <p className="motion-safe:animate-fade-in text-2xl font-bold text-green-800">
              {formatBRL(total_roi_min)} &mdash; {formatBRL(total_roi_max)}
            </p>
          </div>
        </div>

        {/* --- Losses column --- */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <h3 className="mb-3 text-lg font-semibold text-red-800">
            O que voc&ecirc; perde
          </h3>
          <p className="mb-4 text-sm text-red-700">{losses_summary}</p>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-red-600">
              Custo da Inação / Mês
            </p>
            <p className="motion-safe:animate-fade-in text-2xl font-bold text-red-800">
              {formatBRL(cost_of_inaction_monthly)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
