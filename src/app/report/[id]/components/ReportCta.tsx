// ---------------------------------------------------------------------------
// EI-GAP — ReportCta Component
// Story E4b.S2b — CTA for Consulting (Dopamine Sequence Closure)
// Story E4b.S3 — Lead Capture Modal integration
// ---------------------------------------------------------------------------
'use client'

import { useState } from 'react'
import { LeadCaptureModal } from './LeadCaptureModal'

interface ReportCtaProps {
  ctaUrl?: string
  scanId: string
}

export function ReportCta({ ctaUrl, scanId }: ReportCtaProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const href =
    ctaUrl || process.env.NEXT_PUBLIC_CTA_URL || '#'

  return (
    <section
      data-testid="report-cta"
      className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center md:p-10"
    >
      <p className="mb-4 text-base text-gray-600 md:text-lg">
        Descubra como implementar essas oportunidades no seu negocio
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href={href}
          className="inline-block rounded-lg bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 motion-safe:hover:scale-105 md:px-12 md:py-5 md:text-xl"
        >
          Agende uma Consultoria Gratuita
        </a>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-block rounded-lg border-2 border-blue-600 bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 motion-safe:hover:scale-105 md:px-12 md:py-5 md:text-xl"
        >
          Receber Diagnóstico por Email
        </button>
      </div>

      <LeadCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        scanId={scanId}
      />
    </section>
  )
}
