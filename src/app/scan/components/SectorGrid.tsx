'use client'

import type { SectorProfile } from '@/lib/data/loader'
import type { KeyboardEvent } from 'react'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SectorGridProps {
  sectors: SectorProfile[]
  selectedSector: string
  onSelect: (slug: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SectorGrid({ sectors, selectedSector, onSelect }: SectorGridProps) {
  function handleKeyDown(slug: string) {
    return (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(slug)
      }
    }
  }

  return (
    <div
      role="group"
      aria-label="Selecione o setor da sua empresa"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3"
    >
      {sectors.map((sector) => (
        <div
          key={sector.slug}
          role="button"
          tabIndex={0}
          aria-pressed={selectedSector === sector.slug}
          aria-label={sector.name}
          onClick={() => onSelect(sector.slug)}
          onKeyDown={handleKeyDown(sector.slug)}
          className={`motion-safe:transition-all motion-safe:duration-200 cursor-pointer rounded-lg border-2 p-4 text-center font-medium ${
            selectedSector === sector.slug
              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          {sector.name}
        </div>
      ))}

      {/* "Outro" option */}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selectedSector === 'outro'}
        aria-label="Outro"
        onClick={() => onSelect('outro')}
        onKeyDown={handleKeyDown('outro')}
        className={`motion-safe:transition-all motion-safe:duration-200 cursor-pointer rounded-lg border-2 p-4 text-center font-medium ${
          selectedSector === 'outro'
            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        Outro
      </div>
    </div>
  )
}
