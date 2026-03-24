'use client'

import { useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScanFormProcess {
  name: string
  time_per_week: number
  pain_level: 1 | 2 | 3 | 4 | 5
}

export interface ProcessMappingStepProps {
  processes: ScanFormProcess[]
  onChange: (processes: ScanFormProcess[]) => void
  errors?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PROCESSES = 10
const MAX_NAME_LENGTH = 200

const PAIN_LEVELS = [
  { value: 1, label: 'Baixa' },
  { value: 2, label: 'Moderada' },
  { value: 3, label: 'Média' },
  { value: 4, label: 'Alta' },
  { value: 5, label: 'Crítica' },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProcessMappingStep({
  processes,
  onChange,
  errors,
}: ProcessMappingStepProps) {
  const canAdd = processes.length < MAX_PROCESSES

  const handleAdd = useCallback(() => {
    if (!canAdd) return
    onChange([
      ...processes,
      { name: '', time_per_week: 0, pain_level: 1 },
    ])
  }, [processes, onChange, canAdd])

  const handleRemove = useCallback(
    (index: number) => {
      onChange(processes.filter((_, i) => i !== index))
    },
    [processes, onChange],
  )

  const handleFieldChange = useCallback(
    (index: number, field: keyof ScanFormProcess, value: string | number) => {
      const updated = processes.map((p, i) => {
        if (i !== index) return p
        if (field === 'time_per_week') {
          return { ...p, [field]: Number(value) || 0 }
        }
        if (field === 'pain_level') {
          return { ...p, [field]: Number(value) as 1 | 2 | 3 | 4 | 5 }
        }
        return { ...p, [field]: String(value) }
      })
      onChange(updated)
    },
    [processes, onChange],
  )

  return (
    <div className="space-y-4">
      {errors && (
        <p role="alert" className="text-sm text-red-600">
          {errors}
        </p>
      )}

      {processes.map((process, index) => (
        <ProcessRow
          key={index}
          process={process}
          index={index}
          onFieldChange={handleFieldChange}
          onRemove={handleRemove}
        />
      ))}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        aria-label="Adicionar processo"
        className="rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Adicionar processo
      </button>

      <p className="text-xs text-gray-400">
        {processes.length} / {MAX_PROCESSES} processos
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ProcessRow sub-component
// ---------------------------------------------------------------------------

interface ProcessRowProps {
  process: ScanFormProcess
  index: number
  onFieldChange: (index: number, field: keyof ScanFormProcess, value: string | number) => void
  onRemove: (index: number) => void
}

function ProcessRow({ process, index, onFieldChange, onRemove }: ProcessRowProps) {
  const nameId = `process-name-${index}`
  const timeId = `process-time-${index}`
  const painId = `process-pain-${index}`

  return (
    <fieldset className="rounded-lg border border-gray-200 p-4">
      <legend className="sr-only">Processo {index + 1}</legend>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        {/* Process Name */}
        <div className="sm:col-span-5">
          <label htmlFor={nameId} className="block text-sm font-medium text-gray-700">
            Nome do processo
          </label>
          <input
            type="text"
            id={nameId}
            value={process.name}
            onChange={(e) => onFieldChange(index, 'name', e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ex: Atendimento ao cliente"
          />
        </div>

        {/* Hours per week */}
        <div className="sm:col-span-3">
          <label htmlFor={timeId} className="block text-sm font-medium text-gray-700">
            Horas / semana
          </label>
          <input
            type="number"
            id={timeId}
            value={process.time_per_week || ''}
            onChange={(e) => onFieldChange(index, 'time_per_week', e.target.value)}
            min={0}
            max={168}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Pain level */}
        <div className="sm:col-span-3">
          <label htmlFor={painId} className="block text-sm font-medium text-gray-700">
            Nível de dor
          </label>
          <select
            id={painId}
            value={process.pain_level}
            onChange={(e) => onFieldChange(index, 'pain_level', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PAIN_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.value} — {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Remove button */}
        <div className="flex items-end sm:col-span-1">
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label="Remover processo"
            className="rounded-md p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </fieldset>
  )
}
