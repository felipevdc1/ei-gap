// ---------------------------------------------------------------------------
// EI-GAP — TopThreeDeepDive Component
// Story E4b.S2a — Top 3 detailed cards
// ---------------------------------------------------------------------------
import type { RankedOpportunity } from '@/types/scanner'

interface TopThreeDeepDiveProps {
  opportunities: RankedOpportunity[]
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

export function TopThreeDeepDive({ opportunities }: TopThreeDeepDiveProps) {
  const top3 = opportunities.slice(0, 3)

  return (
    <section data-testid="top-three" className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Top 3 Principais Oportunidades
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {top3.map((opp) => (
          <article
            key={opp.rank}
            className="motion-safe:animate-fade-in rounded-lg border border-gray-200 p-5 transition-shadow hover:shadow-md"
          >
            {/* Header: rank + name + badges */}
            <div className="mb-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {opp.rank}
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {opp.category}
                </span>
                {opp.quick_win && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Quick Win
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {opp.name}
              </h3>
            </div>

            {/* Description */}
            <p className="mb-4 text-sm text-gray-600">{opp.description}</p>

            {/* Metrics grid */}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  ROI Estimado
                </dt>
                <dd className="font-semibold text-green-700">
                  {formatBRL(opp.roi_range_min)} &mdash;{' '}
                  {formatBRL(opp.roi_range_max)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Perda/Mês
                </dt>
                <dd className="font-semibold text-red-600">
                  {formatBRL(opp.loss_per_month)}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Tempo p/ Resultado
                </dt>
                <dd className="font-semibold text-gray-900">
                  {opp.time_to_value}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Score
                </dt>
                <dd className="font-semibold text-gray-900">
                  {opp.composite_score.toFixed(1)}
                </dd>
              </div>
            </dl>

            {/* Guardrails */}
            {opp.guardrails.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Salvaguardas
                </p>
                <ul className="list-inside list-disc text-xs text-gray-600">
                  {opp.guardrails.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
