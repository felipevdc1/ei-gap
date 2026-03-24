// ---------------------------------------------------------------------------
// EI-GAP — LeadCaptureModal Component
// Story E4b.S3 — Modal de captura de lead pós-report
// ---------------------------------------------------------------------------
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const emailSchema = z.string().email('Informe um email válido')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LeadCaptureModalProps {
  open: boolean
  onClose: () => void
  scanId: string
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

// ---------------------------------------------------------------------------
// Focus trap helper
// ---------------------------------------------------------------------------
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function useFocusTrap(dialogRef: React.RefObject<HTMLDivElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    if (!dialog) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      const focusables = dialog!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [dialogRef, open])
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function LeadCaptureModal({ open, onClose, scanId }: LeadCaptureModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [lgpdConsent, setLgpdConsent] = useState(false)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')

  useFocusTrap(dialogRef, open)

  // Escape key closes modal
  useEffect(() => {
    if (!open) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  // Auto-close after success
  useEffect(() => {
    if (submitState !== 'success') return

    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [submitState, onClose])

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setEmail('')
      setName('')
      setCompany('')
      setEmailError(null)
      setLgpdConsent(false)
      setSubmitState('idle')
    }
  }, [open])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setEmailError(null)

      // Validate email
      const result = emailSchema.safeParse(email)
      if (!result.success) {
        setEmailError(result.error.issues[0].message)
        return
      }

      setSubmitState('submitting')

      // Build payload — omit empty optional fields
      const payload: Record<string, unknown> = {
        email,
        scan_id: scanId,
        lgpd_consent: lgpdConsent,
        lgpd_consent_at: new Date().toISOString(),
      }
      if (name.trim()) payload.name = name
      if (company.trim()) payload.company = company

      try {
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          setSubmitState('error')
          return
        }

        setSubmitState('success')
      } catch {
        setSubmitState('error')
      }
    },
    [email, name, company, scanId, lgpdConsent],
  )

  if (!open) return null

  const titleId = 'lead-modal-title'

  return (
    // Backdrop
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {submitState === 'success' ? (
          <div className="py-8 text-center">
            <p className="text-xl font-bold text-green-700">
              Obrigado! Entraremos em contato em breve.
            </p>
          </div>
        ) : (
          <>
            <h2
              id={titleId}
              className="mb-4 text-xl font-bold text-gray-900 md:text-2xl"
            >
              Receba seu diagnóstico completo
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Preencha seus dados para receber o relatório detalhado por email.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-4">
                <label
                  htmlFor="lead-email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email *
                </label>
                <input
                  id="lead-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    emailError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="seu@email.com"
                  aria-describedby={emailError ? 'lead-email-error' : undefined}
                  aria-invalid={emailError ? 'true' : undefined}
                />
                {emailError && (
                  <p
                    id="lead-email-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {emailError}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="mb-4">
                <label
                  htmlFor="lead-name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Nome
                </label>
                <input
                  id="lead-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu nome"
                />
              </div>

              {/* Company */}
              <div className="mb-6">
                <label
                  htmlFor="lead-company"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Empresa
                </label>
                <input
                  id="lead-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome da empresa"
                />
              </div>

              {/* LGPD Consent */}
              <div className="mb-6">
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={lgpdConsent}
                    onChange={(e) => setLgpdConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Concordo com a{' '}
                    <Link
                      href="/privacidade"
                      target="_blank"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Politica de Privacidade
                    </Link>
                  </span>
                </label>
              </div>

              {/* Error state */}
              {submitState === 'error' && (
                <p className="mb-4 text-sm text-red-600" role="alert">
                  Erro ao enviar. Tente novamente.
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!lgpdConsent || submitState === 'submitting'}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submitState === 'submitting' ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
