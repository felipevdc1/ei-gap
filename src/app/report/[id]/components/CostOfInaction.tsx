// ---------------------------------------------------------------------------
// EI-GAP — CostOfInaction Component
// Story E4b.S2b — Cost of Inaction (Dopamine Sequence Closure)
// ---------------------------------------------------------------------------

interface CostOfInactionProps {
  monthlyLoss: number
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

interface CostCardProps {
  label: string
  value: number
  emphasis?: boolean
}

function CostCard({ label, value, emphasis }: CostCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 text-center ${
        emphasis
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold motion-safe:animate-pulse md:text-3xl ${
          emphasis ? 'text-red-700' : 'text-red-600'
        }`}
      >
        {formatBRL(value)}
      </p>
    </div>
  )
}

export function CostOfInaction({ monthlyLoss }: CostOfInactionProps) {
  const semiannualLoss = monthlyLoss * 6
  const annualLoss = monthlyLoss * 12

  return (
    <section
      data-testid="cost-of-inaction"
      className="rounded-lg border border-red-200 bg-red-50/30 p-6"
    >
      <h2 className="mb-4 text-xl font-semibold text-gray-900 md:text-2xl">
        Custo da Inacao
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        O quanto sua empresa perde ao nao adotar IA:
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-live="polite">
        <CostCard label="Mensal" value={monthlyLoss} />
        <CostCard label="Semestral" value={semiannualLoss} />
        <CostCard label="Anual" value={annualLoss} emphasis />
      </div>
    </section>
  )
}
