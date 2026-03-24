// ---------------------------------------------------------------------------
// EI-GAP — OpportunitiesTable Component
// Story E4b.S2a — Top 10 table with scores, ROI ranges
// ---------------------------------------------------------------------------
import type { RankedOpportunity } from '@/types/scanner'

interface OpportunitiesTableProps {
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

export function OpportunitiesTable({
  opportunities,
}: OpportunitiesTableProps) {
  return (
    <section data-testid="opportunities-table" className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        Oportunidades Identificadas
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-500">
              <th scope="col" className="px-3 py-3">
                #
              </th>
              <th scope="col" className="px-3 py-3">
                Oportunidade
              </th>
              <th scope="col" className="px-3 py-3">
                Categoria
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Score
              </th>
              <th scope="col" className="hidden px-3 py-3 text-right sm:table-cell">
                ROI Estimado
              </th>
              <th scope="col" className="hidden px-3 py-3 text-right md:table-cell">
                Perda/Mês
              </th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => (
              <tr
                key={opp.rank}
                className="border-b border-gray-100 transition-colors hover:bg-gray-50"
              >
                <td className="px-3 py-3 font-medium text-gray-400">
                  {opp.rank}
                </td>
                <td className="px-3 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{opp.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500 md:hidden">
                      {formatBRL(opp.roi_range_min)} &mdash;{' '}
                      {formatBRL(opp.roi_range_max)}
                    </p>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {opp.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-gray-900">
                  {opp.composite_score.toFixed(1)}
                </td>
                <td className="hidden px-3 py-3 text-right text-gray-700 sm:table-cell">
                  {formatBRL(opp.roi_range_min)} &mdash;{' '}
                  {formatBRL(opp.roi_range_max)}
                </td>
                <td className="hidden px-3 py-3 text-right text-red-600 md:table-cell">
                  {formatBRL(opp.loss_per_month)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
