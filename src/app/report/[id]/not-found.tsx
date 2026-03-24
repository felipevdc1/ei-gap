// ---------------------------------------------------------------------------
// EI-GAP — Report Not Found Page
// Story E4b.S1 — 404 state: "Diagnóstico não encontrado"
// ---------------------------------------------------------------------------
import Link from 'next/link'

export default function ReportNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">404</h1>
      <p className="mb-6 text-lg text-gray-600">
        Diagnóstico não encontrado
      </p>
      <p className="mb-8 text-sm text-gray-500">
        O diagnóstico que você procura não existe ou já expirou.
      </p>
      <Link
        href="/scan"
        className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
      >
        Fazer novo diagnóstico
      </Link>
    </main>
  )
}
