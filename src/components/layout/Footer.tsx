import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 px-4 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} EI-GAP. Todos os direitos
          reservados.
        </p>

        <div className="flex gap-6">
          <Link
            href="/privacidade"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            Politica de Privacidade
          </Link>
          <Link
            href="/termos"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            Termos de Uso
          </Link>
        </div>
      </div>
    </footer>
  )
}
