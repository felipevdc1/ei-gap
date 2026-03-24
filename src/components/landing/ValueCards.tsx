const cards = [
  {
    title: 'Diagnóstico Personalizado',
    description: 'Análise específica para o seu setor e porte de empresa',
    icon: (
      <svg
        aria-hidden="true"
        className="h-8 w-8 text-indigo-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.772.13a18.105 18.105 0 0 1-7.126 0l-.772-.13c-1.717-.293-2.3-2.379-1.067-3.61L5 14.5"
        />
      </svg>
    ),
  },
  {
    title: '10 Oportunidades Rankeadas',
    description:
      'Oportunidades ordenadas por impacto, viabilidade e ROI estimado',
    icon: (
      <svg
        aria-hidden="true"
        className="h-8 w-8 text-indigo-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
  },
  {
    title: 'Gratuito e Instantâneo',
    description:
      'Resultado em minutos, sem compromisso e sem cartão de crédito',
    icon: (
      <svg
        aria-hidden="true"
        className="h-8 w-8 text-indigo-600"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
] as const

export function ValueCards() {
  return (
    <section className="bg-gray-50 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 sm:grid-cols-3">
          {cards.map((card, index) => (
            <article
              key={card.title}
              data-testid={`value-card-${index}`}
              className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200 motion-safe:animate-[fade-in-up_0.5s_ease-out_both] motion-reduce:animate-none"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">
                {card.title}
              </h3>
              <p className="mt-2 text-gray-600">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
