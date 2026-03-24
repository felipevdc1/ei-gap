import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:py-32 lg:py-40">
      {/* Background gradient effect — respects prefers-reduced-motion */}
      <div
        data-testid="hero-bg"
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 motion-safe:animate-[gradient-shift_8s_ease-in-out_infinite] motion-reduce:animate-none"
      />

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          Descubra as 10 Maiores Oportunidades de IA para o Seu Negócio
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
          Diagnóstico gratuito e personalizado. Em minutos, identifique onde a
          IA pode transformar seus resultados.
        </p>

        <div className="mt-10">
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
