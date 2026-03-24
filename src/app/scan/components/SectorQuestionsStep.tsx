'use client'

import { useMemo } from 'react'
import type { SectorProfile, GenericSector } from '@/lib/data/loader'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SectorQuestionsStepProps {
  sectorSlug: string
  answers: Record<string, string>
  onChange: (answers: Record<string, string>) => void
  /** All available sectors (passed from the server to avoid client-side fs reads) */
  sectors: SectorProfile[]
  /** Generic sector fallback (passed from the server) */
  generic: GenericSector
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHARS = 500

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getQuestions(sector: SectorProfile | GenericSector): string[] {
  if ('specific_questions' in sector) {
    return sector.specific_questions
  }
  return sector.universal_questions
}

function findSector(
  slug: string,
  sectors: SectorProfile[],
  generic: GenericSector,
): SectorProfile | GenericSector {
  return sectors.find((s) => s.slug === slug) ?? generic
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SectorQuestionsStep({
  sectorSlug,
  answers,
  onChange,
  sectors,
  generic,
}: SectorQuestionsStepProps) {
  const sector = useMemo(() => findSector(sectorSlug, sectors, generic), [sectorSlug, sectors, generic])
  const questions = useMemo(() => getQuestions(sector), [sector])

  function handleChange(key: string, value: string) {
    onChange({ ...answers, [key]: value })
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const key = `q${index}`
        const value = answers[key] ?? ''
        const counterId = `${key}-counter`
        const textareaId = `sector-question-${key}`

        return (
          <div key={key}>
            <label
              htmlFor={textareaId}
              className="block text-sm font-medium text-gray-700"
            >
              {question}
            </label>
            <textarea
              id={textareaId}
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              maxLength={MAX_CHARS}
              rows={3}
              aria-describedby={counterId}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p
              id={counterId}
              className="mt-1 text-right text-xs text-gray-400"
              aria-live="polite"
            >
              {value.length} / {MAX_CHARS}
            </p>
          </div>
        )
      })}
    </div>
  )
}
