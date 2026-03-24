export interface SectorShowcaseProps {
  sectors: string[]
}

export function SectorShowcase({ sectors }: SectorShowcaseProps) {
  return (
    <section className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Setores Atendidos
        </h2>

        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {sectors.map((name) => (
            <li
              key={name}
              className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-gray-800 ring-1 ring-gray-200"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              <span className="text-sm font-medium">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
