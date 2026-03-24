import { describe, it, expect } from 'vitest'
import type {
  BusinessProfile,
  ProcessMap,
  ScoredOpportunity,
  RankedOpportunity,
} from '@/types/scanner'

import {
  validateIntakeOutput,
  validateExtractionOutput,
  validateScoringOutput,
  validateRankingOutput,
  validateReportOutput,
  checkStrategicBarrier,
  stripLeakedSections,
} from '../pipeline-validators'

// ---------------------------------------------------------------------------
// Valid fixture data (reuse from pipeline.test.ts patterns)
// ---------------------------------------------------------------------------

const validBusinessProfile: BusinessProfile = {
  company_name: 'TechCorp Solutions',
  sector: 'technology',
  company_size: '51-200',
  tech_maturity: 'medium',
  detected_sector: 'technology',
  key_processes: ['customer_support', 'invoice_processing', 'lead_qualification', 'hr_onboarding', 'reporting'],
  business_context: 'Mid-size technology company with moderate AI adoption potential.',
}

const validProcessMap: ProcessMap = {
  processes: [
    {
      name: 'customer_support',
      category: 'operations',
      time_per_week: 20,
      pain_level: 4,
      automation_potential: 0.8,
      opportunities: ['chatbot_triage', 'auto_categorization'],
    },
    {
      name: 'invoice_processing',
      category: 'finance',
      time_per_week: 15,
      pain_level: 5,
      automation_potential: 0.9,
      opportunities: ['ocr_extraction', 'auto_matching'],
    },
    {
      name: 'lead_qualification',
      category: 'sales',
      time_per_week: 10,
      pain_level: 3,
      automation_potential: 0.7,
      opportunities: ['scoring_model', 'auto_enrichment'],
    },
    {
      name: 'hr_onboarding',
      category: 'hr',
      time_per_week: 8,
      pain_level: 3,
      automation_potential: 0.6,
      opportunities: ['doc_generation', 'checklist_automation'],
    },
    {
      name: 'reporting',
      category: 'analytics',
      time_per_week: 12,
      pain_level: 4,
      automation_potential: 0.85,
      opportunities: ['auto_dashboards', 'scheduled_reports'],
    },
  ],
}

const validScoredOpportunities: { opportunities: ScoredOpportunity[] } = {
  opportunities: [
    {
      name: 'OCR Invoice Extraction',
      description: 'Automated extraction of invoice data using OCR and AI validation',
      category: 'finance',
      impact_score: 9,
      feasibility_score: 8,
      effort_score: 4,
      roi_score: 9,
      composite_score: 7.85,
      guardrails: ['manual_review_threshold', 'audit_trail'],
    },
    {
      name: 'Customer Support Chatbot',
      description: 'AI-powered initial customer inquiry routing and resolution',
      category: 'operations',
      impact_score: 8,
      feasibility_score: 7,
      effort_score: 5,
      roi_score: 8,
      composite_score: 7.15,
      guardrails: ['human_escalation', 'confidence_threshold'],
    },
  ],
}

const validRankedOpportunities: { opportunities: RankedOpportunity[] } = {
  opportunities: [
    {
      name: 'OCR Invoice Extraction',
      description: 'Automated extraction of invoice data using OCR and AI validation',
      category: 'finance',
      impact_score: 9,
      feasibility_score: 8,
      effort_score: 4,
      roi_score: 9,
      composite_score: 7.85,
      guardrails: ['manual_review_threshold', 'audit_trail'],
      rank: 1,
      roi_range_min: 50000,
      roi_range_max: 120000,
      loss_per_month: 8500,
      time_to_value: '2-4 weeks',
      quick_win: true,
    },
    {
      name: 'Customer Support Chatbot',
      description: 'AI-powered initial customer inquiry routing and resolution',
      category: 'operations',
      impact_score: 8,
      feasibility_score: 7,
      effort_score: 5,
      roi_score: 8,
      composite_score: 7.15,
      guardrails: ['human_escalation', 'confidence_threshold'],
      rank: 2,
      roi_range_min: 30000,
      roi_range_max: 80000,
      loss_per_month: 5000,
      time_to_value: '4-8 weeks',
      quick_win: false,
    },
  ],
}

const validReport = {
  executive_summary: 'TechCorp Solutions has significant AI automation potential across 5 core processes.',
  opportunities: validRankedOpportunities.opportunities,
  total_roi_min: 80000,
  total_roi_max: 200000,
  cost_of_inaction_monthly: 13500,
  gains_summary: 'Up to R$200k/year in efficiency gains.',
  losses_summary: 'R$13.5k/month lost to manual processes.',
  cta: 'Agende uma consultoria gratuita para aprofundar as oportunidades identificadas.',
}

// ---------------------------------------------------------------------------
// Call 1: validateIntakeOutput
// ---------------------------------------------------------------------------

describe('validateIntakeOutput', () => {
  it('passes with valid business profile with >= 5 key_processes and detected_sector', () => {
    const result = validateIntakeOutput(validBusinessProfile)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects if key_processes has fewer than 5 fields', () => {
    const data = {
      ...validBusinessProfile,
      key_processes: ['a', 'b', 'c'],
    }
    const result = validateIntakeOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /5/.test(e) || /field/i.test(e) || /process/i.test(e))).toBe(true)
  })

  it('rejects if sector is not identified (empty detected_sector)', () => {
    const data = {
      ...validBusinessProfile,
      detected_sector: '',
    }
    const result = validateIntakeOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /sector/i.test(e))).toBe(true)
  })

  it('rejects if detected_sector is missing', () => {
    const { detected_sector: _, ...data } = validBusinessProfile
    const result = validateIntakeOutput(data as BusinessProfile)
    expect(result.valid).toBe(false)
  })

  it('rejects if key_processes is empty', () => {
    const data = { ...validBusinessProfile, key_processes: [] }
    const result = validateIntakeOutput(data)
    expect(result.valid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Call 2: validateExtractionOutput
// ---------------------------------------------------------------------------

describe('validateExtractionOutput', () => {
  it('passes with valid process map with >= 5 processes and specific names', () => {
    const result = validateExtractionOutput(validProcessMap)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects if processes contain generic names (e.g., "Process 1")', () => {
    const data: ProcessMap = {
      processes: [
        { name: 'Process 1', category: 'ops', time_per_week: 10, pain_level: 3, automation_potential: 0.5, opportunities: ['a'] },
        { name: 'Process 2', category: 'ops', time_per_week: 10, pain_level: 3, automation_potential: 0.5, opportunities: ['a'] },
        { name: 'Process 3', category: 'ops', time_per_week: 10, pain_level: 3, automation_potential: 0.5, opportunities: ['a'] },
        { name: 'Process 4', category: 'ops', time_per_week: 10, pain_level: 3, automation_potential: 0.5, opportunities: ['a'] },
        { name: 'Process 5', category: 'ops', time_per_week: 10, pain_level: 3, automation_potential: 0.5, opportunities: ['a'] },
      ],
    }
    const result = validateExtractionOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /generic/i.test(e))).toBe(true)
  })

  it('rejects if fewer than 5 processes are mapped', () => {
    const data: ProcessMap = {
      processes: validProcessMap.processes.slice(0, 3),
    }
    const result = validateExtractionOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /5/.test(e) || /process/i.test(e))).toBe(true)
  })

  it('rejects if no Pareto analysis (no process has automation_potential >= 0.8)', () => {
    const data: ProcessMap = {
      processes: validProcessMap.processes.map((p) => ({
        ...p,
        automation_potential: 0.3,
      })),
    }
    const result = validateExtractionOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /pareto/i.test(e))).toBe(true)
  })

  it('passes Pareto check when at least one process has automation_potential >= 0.8', () => {
    const result = validateExtractionOutput(validProcessMap)
    expect(result.valid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Call 3: validateScoringOutput
// ---------------------------------------------------------------------------

describe('validateScoringOutput', () => {
  it('passes with valid scored opportunities with guardrails and fixed criteria', () => {
    const result = validateScoringOutput(validScoredOpportunities)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects if composite_score lacks fixed criteria (all same composite_score)', () => {
    const data = {
      opportunities: validScoredOpportunities.opportunities.map((o) => ({
        ...o,
        composite_score: 5.0,
      })),
    }
    const result = validateScoringOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /criteria/i.test(e) || /composite/i.test(e))).toBe(true)
  })

  it('rejects if any opportunity has empty guardrails array', () => {
    const data = {
      opportunities: [
        { ...validScoredOpportunities.opportunities[0], guardrails: [] },
        validScoredOpportunities.opportunities[1],
      ],
    }
    const result = validateScoringOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /guardrail/i.test(e))).toBe(true)
  })

  it('rejects if all opportunities have empty guardrails', () => {
    const data = {
      opportunities: validScoredOpportunities.opportunities.map((o) => ({
        ...o,
        guardrails: [],
      })),
    }
    const result = validateScoringOutput(data)
    expect(result.valid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Call 4: validateRankingOutput
// ---------------------------------------------------------------------------

describe('validateRankingOutput', () => {
  it('passes with valid ranked opportunities with ROI and loss aversion', () => {
    const result = validateRankingOutput(validRankedOpportunities)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects if opportunities are missing ROI ranges (roi_range_min/max both 0)', () => {
    const data = {
      opportunities: validRankedOpportunities.opportunities.map((o) => ({
        ...o,
        roi_range_min: 0,
        roi_range_max: 0,
      })),
    }
    const result = validateRankingOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /roi/i.test(e))).toBe(true)
  })

  it('rejects if opportunities are missing loss aversion (loss_per_month = 0 for all)', () => {
    const data = {
      opportunities: validRankedOpportunities.opportunities.map((o) => ({
        ...o,
        loss_per_month: 0,
      })),
    }
    const result = validateRankingOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /loss/i.test(e))).toBe(true)
  })

  it('passes if at least one opportunity has valid ROI and loss', () => {
    const data = {
      opportunities: [
        { ...validRankedOpportunities.opportunities[0], roi_range_min: 0, roi_range_max: 0, loss_per_month: 0 },
        validRankedOpportunities.opportunities[1],
      ],
    }
    const result = validateRankingOutput(data)
    expect(result.valid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Call 5: validateReportOutput
// ---------------------------------------------------------------------------

describe('validateReportOutput', () => {
  it('passes with valid report without implementation details and with CTA', () => {
    const result = validateReportOutput(validReport)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects if report contains implementation details', () => {
    const data = {
      ...validReport,
      executive_summary: 'Passo a passo para configurar o sistema de automação com API key e deploy.',
    }
    const result = validateReportOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /implementation/i.test(e) || /forbidden/i.test(e) || /barrier/i.test(e))).toBe(true)
  })

  it('rejects if report has no CTA', () => {
    const { cta: _, ...data } = validReport
    const result = validateReportOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /cta/i.test(e))).toBe(true)
  })

  it('rejects if CTA is empty string', () => {
    const data = { ...validReport, cta: '' }
    const result = validateReportOutput(data)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => /cta/i.test(e))).toBe(true)
  })

  it('rejects if report text contains forbidden terms in gains_summary', () => {
    const data = {
      ...validReport,
      gains_summary: 'Para implementação: configurar o cronjob de relatórios automatizados.',
    }
    const result = validateReportOutput(data)
    expect(result.valid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Strategic Barrier: checkStrategicBarrier
// ---------------------------------------------------------------------------

describe('checkStrategicBarrier', () => {
  it('passes clean text with no forbidden terms', () => {
    const result = checkStrategicBarrier('A empresa possui grande potencial de automação em processos financeiros.')
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('detects "passo a passo"', () => {
    const result = checkStrategicBarrier('Aqui está o passo a passo para automatizar o processo.')
    expect(result.passed).toBe(false)
    expect(result.violations).toContain('passo a passo')
  })

  it('detects "implementação:"', () => {
    const result = checkStrategicBarrier('Implementação: primeiro instale o software.')
    expect(result.passed).toBe(false)
    expect(result.violations).toContain('implementação:')
  })

  it('detects "configurar"', () => {
    const result = checkStrategicBarrier('Você precisa configurar o servidor antes.')
    expect(result.passed).toBe(false)
    expect(result.violations).toContain('configurar')
  })

  it('detects "setup"', () => {
    const result = checkStrategicBarrier('Follow this setup guide to get started.')
    expect(result.passed).toBe(false)
    expect(result.violations).toContain('setup')
  })

  it('detects "cronjob"', () => {
    const result = checkStrategicBarrier('Agende um cronjob para executar diariamente.')
    expect(result.passed).toBe(false)
    expect(result.violations).toContain('cronjob')
  })

  it('detects "API key"', () => {
    const result = checkStrategicBarrier('Use your API key to authenticate.')
    expect(result.passed).toBe(false)
    expect(result.violations).toContain('api key')
  })

  it('detects "código"', () => {
    const result = checkStrategicBarrier('O código a seguir mostra como fazer.')
    expect(result.passed).toBe(false)
    expect(result.violations).toContain('código')
  })

  it('detects "deploy"', () => {
    const result = checkStrategicBarrier('Faça o deploy da aplicação no servidor.')
    expect(result.passed).toBe(false)
    expect(result.violations).toContain('deploy')
  })

  it('detects multiple forbidden terms at once', () => {
    const result = checkStrategicBarrier('Passo a passo: configurar API key e fazer deploy.')
    expect(result.passed).toBe(false)
    expect(result.violations.length).toBeGreaterThanOrEqual(3)
  })

  it('is case-insensitive', () => {
    const result = checkStrategicBarrier('SETUP the DEPLOY with API KEY')
    expect(result.passed).toBe(false)
    expect(result.violations.length).toBeGreaterThanOrEqual(3)
  })
})

// ---------------------------------------------------------------------------
// Strip leaked sections: stripLeakedSections
// ---------------------------------------------------------------------------

describe('stripLeakedSections', () => {
  it('returns text unchanged when no forbidden terms are present', () => {
    const text = 'A empresa possui grande potencial.\n\nRecomendamos investir em automação.'
    const result = stripLeakedSections(text)
    expect(result).toBe(text)
  })

  it('removes entire paragraph containing a forbidden term', () => {
    const text = 'Primeira seção limpa.\n\nPasso a passo para configurar.\n\nTerceira seção limpa.'
    const result = stripLeakedSections(text)
    expect(result).toContain('Primeira seção limpa.')
    expect(result).toContain('Terceira seção limpa.')
    expect(result).not.toContain('Passo a passo')
    expect(result).not.toContain('configurar')
  })

  it('removes multiple paragraphs with forbidden terms', () => {
    const text = 'Intro limpa.\n\nConfigurar o servidor.\n\nDeploy na nuvem.\n\nConclusão limpa.'
    const result = stripLeakedSections(text)
    expect(result).toContain('Intro limpa.')
    expect(result).toContain('Conclusão limpa.')
    expect(result).not.toContain('Configurar')
    expect(result).not.toContain('Deploy')
  })

  it('handles text with only forbidden paragraphs (returns empty or minimal)', () => {
    const text = 'Setup the cronjob.\n\nDeploy the código.'
    const result = stripLeakedSections(text)
    expect(result.trim()).toBe('')
  })

  it('is case-insensitive when stripping', () => {
    const text = 'Clean section.\n\nSETUP the thing.\n\nAnother clean.'
    const result = stripLeakedSections(text)
    expect(result).toContain('Clean section.')
    expect(result).toContain('Another clean.')
    expect(result).not.toContain('SETUP')
  })

  it('handles single-paragraph text with forbidden term', () => {
    const text = 'Aqui está o código para deploy.'
    const result = stripLeakedSections(text)
    expect(result.trim()).toBe('')
  })

  it('preserves paragraph structure after stripping', () => {
    const text = 'Parágrafo 1.\n\nDeploy instructions.\n\nParágrafo 3.'
    const result = stripLeakedSections(text)
    // Should have two paragraphs separated by double newline
    const paragraphs = result.split('\n\n').filter((p: string) => p.trim().length > 0)
    expect(paragraphs).toHaveLength(2)
  })
})
