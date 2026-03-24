'use client'

import type { BusinessInfoData } from './BusinessInfoStep'
import type { ScanFormProcess } from './ProcessMappingStep'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewStepProps {
  sector: string
  businessInfo: BusinessInfoData
  sectorAnswers: Record<string, string>
  processes: ScanFormProcess[]
  onEditStep: (step: number) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TECH_MATURITY_LABELS: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const PAIN_LEVEL_LABELS: Record<number, string> = {
  1: 'Baixa',
  2: 'Moderada',
  3: 'Média',
  4: 'Alta',
  5: 'Crítica',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewStep({
  sector,
  businessInfo,
  sectorAnswers,
  processes,
  onEditStep,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Sector */}
      <ReviewSection
        testId="review-section-sector"
        title="Setor"
        onEdit={() => onEditStep(1)}
      >
        <p className="text-sm text-gray-700 capitalize">{sector}</p>
      </ReviewSection>

      {/* Business Info */}
      <ReviewSection
        testId="review-section-business"
        title="Informações da Empresa"
        onEdit={() => onEditStep(2)}
      >
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-500">Empresa</dt>
            <dd className="text-gray-700">{businessInfo.company_name}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Tamanho</dt>
            <dd className="text-gray-700">{businessInfo.company_size}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Maturidade tecnológica</dt>
            <dd className="text-gray-700">
              {TECH_MATURITY_LABELS[businessInfo.tech_maturity] ?? businessInfo.tech_maturity}
            </dd>
          </div>
          {businessInfo.current_tools && (
            <div>
              <dt className="font-medium text-gray-500">Ferramentas atuais</dt>
              <dd className="text-gray-700">{businessInfo.current_tools}</dd>
            </div>
          )}
        </dl>
      </ReviewSection>

      {/* Sector Answers */}
      <ReviewSection
        testId="review-section-questions"
        title="Respostas do Setor"
        onEdit={() => onEditStep(3)}
      >
        {Object.keys(sectorAnswers).length > 0 ? (
          <ul className="space-y-2 text-sm text-gray-700">
            {Object.entries(sectorAnswers).map(([key, answer]) => (
              <li key={key} className="rounded bg-gray-50 p-2">
                {answer}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Nenhuma resposta preenchida</p>
        )}
      </ReviewSection>

      {/* Processes */}
      <ReviewSection
        testId="review-section-processes"
        title="Processos Mapeados"
        onEdit={() => onEditStep(4)}
      >
        <ul className="space-y-2">
          {processes.map((process, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded bg-gray-50 p-3 text-sm"
            >
              <span className="font-medium text-gray-700">{process.name}</span>
              <span className="flex gap-3 text-gray-500">
                <span>{process.time_per_week}h/sem</span>
                <span>Dor: {PAIN_LEVEL_LABELS[process.pain_level] ?? process.pain_level}</span>
              </span>
            </li>
          ))}
        </ul>
      </ReviewSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReviewSection sub-component
// ---------------------------------------------------------------------------

interface ReviewSectionProps {
  testId: string
  title: string
  onEdit: () => void
  children: React.ReactNode
}

function ReviewSection({ testId, title, onEdit, children }: ReviewSectionProps) {
  return (
    <section data-testid={testId} className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
          aria-label={`Editar ${title}`}
        >
          Editar
        </button>
      </div>
      {children}
    </section>
  )
}
