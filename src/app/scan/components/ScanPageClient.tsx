'use client'

import { useState } from 'react'
import type { SectorProfile, GenericSector } from '@/lib/data/loader'
import { ScanForm } from './ScanForm'
import { FreeTextScan } from './FreeTextScan'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScanMode = 'free-text' | 'guided'

interface ScanPageClientProps {
  sectors: SectorProfile[]
  generic: GenericSector
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScanPageClient({ sectors, generic }: ScanPageClientProps) {
  const [mode, setMode] = useState<ScanMode>('free-text')

  return (
    <>
      {/* Mode selector tabs */}
      <div className="mx-auto max-w-2xl px-4 pt-8">
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setMode('free-text')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'free-text'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Texto Livre
          </button>
          <button
            type="button"
            onClick={() => setMode('guided')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'guided'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Formulário Guiado
          </button>
        </div>
      </div>

      {/* Render the selected mode */}
      {mode === 'free-text' ? (
        <FreeTextScan />
      ) : (
        <ScanForm sectors={sectors} generic={generic} />
      )}
    </>
  )
}
