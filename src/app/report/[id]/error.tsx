// ---------------------------------------------------------------------------
// EI-GAP — Report Error Boundary
// Story E4b.S1 — 500 state: "Ocorreu um erro. Tente novamente."
// ---------------------------------------------------------------------------
'use client'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ReportError({ error, reset }: ErrorBoundaryProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-red-600">Ops!</h1>
      <p className="mb-6 text-lg text-gray-600">
        Ocorreu um erro ao carregar seu diagnóstico.
      </p>
      <p className="mb-8 text-sm text-gray-500">
        Tente novamente em alguns instantes.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
      >
        Tente novamente
      </button>
    </main>
  )
}
