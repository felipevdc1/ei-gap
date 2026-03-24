'use client'

import { useReducer, useRef, useEffect, useCallback, useState } from 'react'
import type { SectorProfile, GenericSector } from '@/lib/data/loader'
import type { ScanFormData, CompanySize, TechMaturity } from '@/types/scanner'
import { SectorGrid } from './SectorGrid'
import { BusinessInfoStep } from './BusinessInfoStep'
import type { BusinessInfoData } from './BusinessInfoStep'
import { SectorQuestionsStep } from './SectorQuestionsStep'
import { ProcessMappingStep } from './ProcessMappingStep'
import type { ScanFormProcess } from './ProcessMappingStep'
import { ReviewStep } from './ReviewStep'
import { ScanLoading } from './ScanLoading'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const STEPS = [
  'Sector Selection',
  'Company Info',
  'Sector Questions',
  'Process Mapping',
  'Review & Submit',
] as const

type StepTitle = (typeof STEPS)[number]

interface StepData {
  sector: string
  businessInfo: BusinessInfoData
  sectorAnswers: Record<string, string>
  processes: ScanFormProcess[]
}

interface FormState {
  currentStep: number
  submitting: boolean
  stepData: StepData
}

type FormAction =
  | { type: 'NEXT' }
  | { type: 'BACK' }
  | { type: 'GOTO_STEP'; step: number }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }
  | { type: 'SET_SECTOR'; sector: string }
  | { type: 'SET_BUSINESS_INFO'; data: BusinessInfoData }
  | { type: 'SET_SECTOR_ANSWERS'; answers: Record<string, string> }
  | { type: 'SET_PROCESSES'; processes: ScanFormProcess[] }

// ---------------------------------------------------------------------------
// Reducer (state machine)
// ---------------------------------------------------------------------------

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'NEXT':
      if (state.currentStep >= 5) return state
      return { ...state, currentStep: state.currentStep + 1 }
    case 'BACK':
      if (state.currentStep <= 1) return state
      return { ...state, currentStep: state.currentStep - 1 }
    case 'GOTO_STEP':
      if (action.step < 1 || action.step > 5) return state
      return { ...state, currentStep: action.step }
    case 'SUBMIT_START':
      return { ...state, submitting: true }
    case 'SUBMIT_END':
      return { ...state, submitting: false }
    case 'SET_SECTOR':
      return {
        ...state,
        stepData: { ...state.stepData, sector: action.sector },
      }
    case 'SET_BUSINESS_INFO':
      return {
        ...state,
        stepData: { ...state.stepData, businessInfo: action.data },
      }
    case 'SET_SECTOR_ANSWERS':
      return {
        ...state,
        stepData: { ...state.stepData, sectorAnswers: action.answers },
      }
    case 'SET_PROCESSES':
      return {
        ...state,
        stepData: { ...state.stepData, processes: action.processes },
      }
    default:
      return state
  }
}

const initialState: FormState = {
  currentStep: 1,
  submitting: false,
  stepData: {
    sector: '',
    businessInfo: {
      company_name: '',
      company_size: '',
      tech_maturity: '',
      current_tools: '',
    },
    sectorAnswers: {},
    processes: [],
  },
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateStep1(stepData: StepData): boolean {
  return stepData.sector !== ''
}

function validateStep2(stepData: StepData): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!stepData.businessInfo.company_name.trim()) {
    errors.company_name = 'Nome da empresa é obrigatório'
  }
  if (!stepData.businessInfo.company_size) {
    errors.company_size = 'Tamanho da empresa é obrigatório'
  }
  if (!stepData.businessInfo.tech_maturity) {
    errors.tech_maturity = 'Maturidade tecnológica é obrigatória'
  }
  return errors
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScanFormProps {
  sectors: SectorProfile[]
  generic: GenericSector
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScanForm({ sectors, generic }: ScanFormProps) {
  const [state, dispatch] = useReducer(formReducer, initialState)
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({})
  const [step4Error, setStep4Error] = useState<string>('')
  const stepRef = useRef<HTMLDivElement>(null)

  // Focus management: auto-focus step container on step change
  useEffect(() => {
    stepRef.current?.focus()
  }, [state.currentStep])

  const handleNext = useCallback(() => {
    // Validate current step before advancing
    if (state.currentStep === 1) {
      if (!validateStep1(state.stepData)) return
    }
    if (state.currentStep === 2) {
      const errors = validateStep2(state.stepData)
      if (Object.keys(errors).length > 0) {
        setStep2Errors(errors)
        return
      }
      setStep2Errors({})
    }
    if (state.currentStep === 4) {
      if (state.stepData.processes.length < 3) {
        setStep4Error('Mínimo de 3 processos obrigatório')
        return
      }
      if (state.stepData.processes.length > 10) {
        setStep4Error('Máximo de 10 processos permitido')
        return
      }
      setStep4Error('')
    }
    dispatch({ type: 'NEXT' })
  }, [state.currentStep, state.stepData])

  const handleBack = useCallback(() => {
    setStep2Errors({})
    setStep4Error('')
    dispatch({ type: 'BACK' })
  }, [])

  const handleSubmit = useCallback(() => {
    dispatch({ type: 'SUBMIT_START' })
  }, [])

  const handleRetry = useCallback(() => {
    dispatch({ type: 'SUBMIT_END' })
  }, [])

  const handleEditStep = useCallback((step: number) => {
    dispatch({ type: 'GOTO_STEP', step })
  }, [])

  const handleSectorSelect = useCallback((slug: string) => {
    dispatch({ type: 'SET_SECTOR', sector: slug })
  }, [])

  const handleBusinessInfoChange = useCallback((data: BusinessInfoData) => {
    dispatch({ type: 'SET_BUSINESS_INFO', data })
  }, [])

  const handleSectorAnswersChange = useCallback((answers: Record<string, string>) => {
    dispatch({ type: 'SET_SECTOR_ANSWERS', answers })
  }, [])

  const handleProcessesChange = useCallback((processes: ScanFormProcess[]) => {
    dispatch({ type: 'SET_PROCESSES', processes })
  }, [])

  const isLastStep = state.currentStep === 5
  const isFirstStep = state.currentStep === 1
  const currentTitle = STEPS[state.currentStep - 1]

  // Build ScanFormData for API submission
  const buildFormData = useCallback((): ScanFormData => ({
    sector: state.stepData.sector,
    company_name: state.stepData.businessInfo.company_name,
    company_size: state.stepData.businessInfo.company_size as CompanySize,
    tech_maturity: state.stepData.businessInfo.tech_maturity as TechMaturity,
    current_tools: state.stepData.businessInfo.current_tools || undefined,
    sector_answers: state.stepData.sectorAnswers,
    processes: state.stepData.processes,
  }), [state.stepData])

  // Show ScanLoading when submitting
  if (state.submitting) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <ScanLoading formData={buildFormData()} onRetry={handleRetry} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Progress indicator */}
      <ProgressIndicator currentStep={state.currentStep} />

      {/* Step content */}
      <div
        ref={stepRef}
        data-testid={`step-${state.currentStep}`}
        tabIndex={-1}
        className="mt-8 rounded-lg border border-gray-200 p-6 outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`Step ${state.currentStep}: ${currentTitle}`}
      >
        <h2 className="text-xl font-semibold">{currentTitle}</h2>

        {state.currentStep === 1 && (
          <div className="mt-4">
            <SectorGrid
              sectors={sectors}
              selectedSector={state.stepData.sector}
              onSelect={handleSectorSelect}
            />
          </div>
        )}

        {state.currentStep === 2 && (
          <div className="mt-4">
            <BusinessInfoStep
              data={state.stepData.businessInfo}
              onChange={handleBusinessInfoChange}
              errors={step2Errors}
            />
          </div>
        )}

        {state.currentStep === 3 && (
          <div className="mt-4">
            <SectorQuestionsStep
              sectorSlug={state.stepData.sector}
              answers={state.stepData.sectorAnswers}
              onChange={handleSectorAnswersChange}
              sectors={sectors}
              generic={generic}
            />
          </div>
        )}

        {state.currentStep === 4 && (
          <div className="mt-4">
            <ProcessMappingStep
              processes={state.stepData.processes}
              onChange={handleProcessesChange}
              errors={step4Error || undefined}
            />
          </div>
        )}

        {state.currentStep === 5 && (
          <div className="mt-4">
            <ReviewStep
              sector={state.stepData.sector}
              businessInfo={state.stepData.businessInfo}
              sectorAnswers={state.stepData.sectorAnswers}
              processes={state.stepData.processes}
              onEditStep={handleEditStep}
            />
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        {!isFirstStep ? (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        ) : (
          <span />
        )}

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={state.submitting}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Gerar Diagnóstico
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progress Indicator sub-component
// ---------------------------------------------------------------------------

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((title, index) => {
          const stepNumber = index + 1
          const isCurrent = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <li
              key={title}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Step ${stepNumber}: ${title}`}
              className={`flex flex-1 flex-col items-center text-center text-xs ${
                isCurrent
                  ? 'font-bold text-blue-600'
                  : isCompleted
                    ? 'text-green-600'
                    : 'text-gray-400'
              }`}
            >
              <span
                className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {stepNumber}
              </span>
              <span>{title}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
