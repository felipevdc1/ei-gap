import Link from 'next/link'

export function CtaSection() {
  return (
    <section className="bg-indigo-50 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Pronto para descobrir suas oportunidades?
        </h2>

        <p className="mt-4 text-lg text-gray-600">
          Leva apenas alguns minutos. Sem compromisso, sem custo.
        </p>

        <div className="mt-8">
          <Link
            href="/scan"
            className="inline-block rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Comece Agora — É Grátis
          </Link>
        </div>
      </div>
    </section>
  )
}
