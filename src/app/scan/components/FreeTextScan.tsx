'use client'

import { useState, useCallback } from 'react'
import { ScanLoadingFreeText } from './ScanLoadingFreeText'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_CHARS = 50
const MAX_CHARS = 5000

const PLACEHOLDER = `Descreva seu negócio em detalhes:

\u2022 Qual seu setor e o que sua empresa faz?
\u2022 Quantos funcionários?
\u2022 Quais processos mais consomem tempo da equipe?
\u2022 Quais ferramentas/sistemas vocês usam hoje?
\u2022 Onde estão as maiores dores operacionais?
\u2022 O que você gostaria de automatizar ou melhorar com IA?

Quanto mais detalhes, melhor o diagnóstico.`

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FreeTextScan() {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const charCount = text.length
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS

  const handleSubmit = useCallback(() => {
    if (!isValid) return
    setSubmitting(true)
  }, [isValid])

  const handleRetry = useCallback(() => {
    setSubmitting(false)
  }, [])

  if (submitting) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <ScanLoadingFreeText text={text} onRetry={handleRetry} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Descreva seu negócio</h2>
        <p className="mt-2 text-sm text-gray-600">
          Conte sobre sua empresa, processos, dores e o que gostaria de melhorar com IA.
          Quanto mais detalhes, melhor o diagnóstico.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder={PLACEHOLDER}
          className="mt-4 min-h-[300px] w-full rounded-md border border-gray-300 p-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Descrição do negócio"
        />

        {/* Character count */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <span
            className={
              charCount < MIN_CHARS
                ? 'text-amber-600'
                : charCount > MAX_CHARS * 0.9
                  ? 'text-amber-600'
                  : 'text-gray-400'
            }
          >
            {charCount < MIN_CHARS
              ? `Mínimo ${MIN_CHARS} caracteres (faltam ${MIN_CHARS - charCount})`
              : `${charCount} / ${MAX_CHARS} caracteres`}
          </span>
        </div>
      </div>

      {/* Submit button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Gerar Diagnóstico
        </button>
      </div>
    </div>
  )
}
