'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScanLoadingFreeTextProps {
  text: string
  onRetry: () => void
}

interface SSEEvent {
  type: string
  phase: number
  name: string
  reportId?: string
  error?: string
}

type LoadingStatus = 'loading' | 'error' | 'complete'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASE_MESSAGES: Record<number, string> = {
  1: 'Analisando seu negócio...',
  2: 'Mapeando processos...',
  3: 'Avaliando oportunidades...',
  4: 'Rankeando por impacto...',
  5: 'Gerando seu diagnóstico...',
}

const TOTAL_PHASES = 5

// ---------------------------------------------------------------------------
// SSE stream parser (same logic as ScanLoading)
// ---------------------------------------------------------------------------

async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      if (!part.trim()) continue

      const dataLine = part
        .split('\n')
        .find((line) => line.startsWith('data: '))

      if (dataLine) {
        try {
          const json = JSON.parse(dataLine.slice(6)) as SSEEvent
          yield json
        } catch {
          // Skip malformed events
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScanLoadingFreeText({ text, onRetry }: ScanLoadingFreeTextProps) {
  const router = useRouter()
  const [status, setStatus] = useState<LoadingStatus>('loading')
  const [currentPhase, setCurrentPhase] = useState(1)
  const [completedPhases, setCompletedPhases] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const progressPercent = Math.round((completedPhases / TOTAL_PHASES) * 100)
  const phaseMessage = PHASE_MESSAGES[currentPhase] ?? 'Processando...'

  const startScan = useCallback(async () => {
    const abort = new AbortController()
    abortRef.current = abort

    try {
      const response = await fetch('/api/scan-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        setStatus('error')
        setErrorMessage('Erro ao iniciar o diagnóstico. Tente novamente.')
        return
      }

      if (!response.body) {
        setStatus('error')
        setErrorMessage('Erro ao receber dados do servidor.')
        return
      }

      const reader = response.body.getReader()

      for await (const event of parseSSEStream(reader)) {
        if (abort.signal.aborted) break

        switch (event.type) {
          case 'phase_start':
            setCurrentPhase(event.phase)
            break

          case 'phase_complete':
            setCompletedPhases((prev) => Math.max(prev, event.phase))
            break

          case 'scan_complete':
            setCompletedPhases(TOTAL_PHASES)
            setStatus('complete')
            if (event.reportId) {
              router.push(`/report/${event.reportId}`)
            }
            break

          case 'scan_error':
            setStatus('error')
            setErrorMessage(
              'Ocorreu um erro durante o diagnóstico. Por favor, tente novamente.',
            )
            break
        }
      }
    } catch {
      if (!abort.signal.aborted) {
        setStatus('error')
        setErrorMessage(
          'Erro de conexão. Verifique sua internet e tente novamente.',
        )
      }
    }
  }, [text, router])

  useEffect(() => {
    startScan()

    return () => {
      abortRef.current?.abort()
    }
  }, [startScan])

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
        <div className="mb-4 rounded-full bg-red-100 p-4">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Ocorreu um erro
        </h3>
        <p className="mb-6 max-w-sm text-sm text-gray-600">{errorMessage}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col items-center justify-center py-16" aria-live="polite">
      {/* Spinner */}
      <div className="mb-6">
        <svg
          className="h-12 w-12 animate-spin text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>

      {/* Phase message */}
      <p className="mb-4 text-lg font-medium text-gray-700">{phaseMessage}</p>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do diagnóstico"
          className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-gray-500">{progressPercent}%</p>
      </div>
    </div>
  )
}
