// ---------------------------------------------------------------------------
// EI-GAP — Scan Error Boundary
// Story E5.S4 — Error boundary for scan page
// ---------------------------------------------------------------------------
'use client'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ScanError({ error, reset }: ErrorBoundaryProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-red-600">Ops!</h1>
      <p className="mb-6 text-lg text-gray-600">
        Ocorreu um erro ao carregar o scanner.
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
