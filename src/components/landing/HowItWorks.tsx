const steps = [
  {
    number: 1,
    title: 'Conte sobre seu negócio',
    description:
      'Responda algumas perguntas rápidas sobre seu setor, processos e desafios.',
  },
  {
    number: 2,
    title: 'IA analisa suas oportunidades',
    description:
      'Nossa inteligência artificial cruza dados e identifica onde a IA pode gerar mais impacto.',
  },
  {
    number: 3,
    title: 'Receba seu diagnóstico completo',
    description:
      'Um relatório detalhado com as 10 maiores oportunidades, ROI estimado e plano de ação.',
  },
] as const

export function HowItWorks() {
  return (
    <section className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Como Funciona
        </h2>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              data-testid={`step-${step.number}`}
              className="text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                {step.number}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-2 text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
