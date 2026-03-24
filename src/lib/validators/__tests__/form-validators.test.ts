import { describe, it, expect } from 'vitest'
import {
  scanFormSchema,
  leadSchema,
  businessProfileSchema,
  processMapSchema,
  scoredOpportunitiesSchema,
  rankedOpportunitiesSchema,
} from '../form-validators'

// ---------------------------------------------------------------------------
// Helpers — realistic test data based on sector-profiles.yaml
// ---------------------------------------------------------------------------

function validScanFormData() {
  return {
    sector: 'ecommerce',
    company_name: 'Loja Tech LTDA',
    company_size: '11-50' as const,
    tech_maturity: 'medium' as const,
    current_tools: 'Shopify, RD Station, WhatsApp Business',
    sector_answers: {
      q1: 'Processamos ~150 pedidos por dia',
      q2: 'Cerca de 40% sao perguntas repetitivas',
      q3: 'Usamos Bling pra gerenciar entre loja e marketplace',
      q4: 'Criamos manualmente no Canva + ChatGPT',
      q5: 'Tempo medio de resposta: 2-4 horas',
    },
    processes: [
      { name: 'Atendimento ao cliente', time_per_week: 20, pain_level: 4 as const },
      { name: 'Gestao de estoque e pedidos', time_per_week: 15, pain_level: 3 as const },
      { name: 'Criacao de fotos/descricoes de produto', time_per_week: 10, pain_level: 5 as const },
    ],
  }
}

function validLeadData() {
  return {
    email: 'contato@lojatech.com.br',
    name: 'Maria Silva',
    company: 'Loja Tech LTDA',
    scan_id: 'scan_abc123',
    lgpd_consent: true as const,
    lgpd_consent_at: '2026-01-01T00:00:00.000Z',
  }
}

function validBusinessProfile() {
  return {
    company_name: 'Loja Tech LTDA',
    sector: 'ecommerce',
    company_size: '11-50',
    tech_maturity: 'medium',
    detected_sector: 'ecommerce',
    key_processes: [
      'Atendimento ao cliente',
      'Gestao de estoque e pedidos',
      'Criacao de fotos/descricoes de produto',
    ],
    business_context: 'E-commerce de medio porte com operacao multicanal e necessidade de automacao em atendimento e estoque.',
  }
}

function validProcessMap() {
  return {
    processes: [
      {
        name: 'Atendimento ao cliente',
        category: 'customer_service',
        time_per_week: 20,
        pain_level: 4,
        automation_potential: 0.8,
        opportunities: ['chatbot_triage', 'auto_categorization'],
      },
      {
        name: 'Gestao de estoque',
        category: 'operations',
        time_per_week: 15,
        pain_level: 3,
        automation_potential: 0.6,
        opportunities: ['inventory_sync', 'demand_forecast'],
      },
      {
        name: 'Criacao de descricoes',
        category: 'content',
        time_per_week: 10,
        pain_level: 5,
        automation_potential: 0.9,
        opportunities: ['ai_copywriting', 'image_generation'],
      },
    ],
  }
}

function validScoredOpportunity() {
  return {
    name: 'Chatbot de Atendimento IA',
    description: 'Chatbot inteligente para triagem e resolucao de perguntas repetitivas',
    category: 'customer_service',
    impact_score: 8,
    feasibility_score: 7,
    effort_score: 5,
    roi_score: 9,
    composite_score: 7.8,
    guardrails: ['Manter opcao de atendimento humano', 'Monitorar CSAT pos-implementacao'],
  }
}

function validRankedOpportunity() {
  return {
    ...validScoredOpportunity(),
    rank: 1,
    roi_range_min: 15000,
    roi_range_max: 35000,
    loss_per_month: 8500,
    time_to_value: '2-4 semanas',
    quick_win: true,
  }
}

// ===========================================================================
// scanFormSchema
// ===========================================================================

describe('scanFormSchema', () => {
  it('accepts valid scan form data', () => {
    const result = scanFormSchema.safeParse(validScanFormData())
    expect(result.success).toBe(true)
  })

  it('accepts data without optional current_tools', () => {
    const data = validScanFormData()
    delete (data as Record<string, unknown>).current_tools
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  // --- Required fields ---

  it('rejects missing sector', () => {
    const data = validScanFormData()
    delete (data as Record<string, unknown>).sector
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects missing company_name', () => {
    const data = validScanFormData()
    delete (data as Record<string, unknown>).company_name
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects empty string for sector', () => {
    const data = { ...validScanFormData(), sector: '' }
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects empty string for company_name', () => {
    const data = { ...validScanFormData(), company_name: '' }
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  // --- Enum validation ---

  it('rejects invalid company_size', () => {
    const data = { ...validScanFormData(), company_size: 'huge' }
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects invalid tech_maturity', () => {
    const data = { ...validScanFormData(), tech_maturity: 'ultra' }
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('accepts all valid company_size values', () => {
    const sizes = ['1-10', '11-50', '51-200', '201-500', '500+'] as const
    for (const size of sizes) {
      const data = { ...validScanFormData(), company_size: size }
      const result = scanFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    }
  })

  it('accepts all valid tech_maturity values', () => {
    const maturities = ['low', 'medium', 'high'] as const
    for (const mat of maturities) {
      const data = { ...validScanFormData(), tech_maturity: mat }
      const result = scanFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    }
  })

  // --- String limits ---

  it('rejects company_name longer than 200 chars', () => {
    const data = { ...validScanFormData(), company_name: 'A'.repeat(201) }
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('accepts company_name at exactly 200 chars', () => {
    const data = { ...validScanFormData(), company_name: 'A'.repeat(200) }
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('rejects current_tools longer than 500 chars', () => {
    const data = { ...validScanFormData(), current_tools: 'X'.repeat(501) }
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('accepts current_tools at exactly 500 chars', () => {
    const data = { ...validScanFormData(), current_tools: 'X'.repeat(500) }
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  // --- sector_answers ---

  it('rejects sector_answers with answer longer than 500 chars', () => {
    const data = validScanFormData()
    data.sector_answers.q1 = 'Y'.repeat(501)
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  // --- processes ---

  it('rejects fewer than 3 processes', () => {
    const data = validScanFormData()
    data.processes = data.processes.slice(0, 2)
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects more than 10 processes', () => {
    const data = validScanFormData()
    data.processes = Array.from({ length: 11 }, (_, i) => ({
      name: `Process ${i}`,
      time_per_week: 5,
      pain_level: 3 as const,
    }))
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('accepts exactly 10 processes', () => {
    const data = validScanFormData()
    data.processes = Array.from({ length: 10 }, (_, i) => ({
      name: `Process ${i}`,
      time_per_week: 5,
      pain_level: 3 as const,
    }))
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('rejects pain_level outside 1-5 range', () => {
    const data = validScanFormData()
    data.processes[0].pain_level = 0 as never
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects pain_level above 5', () => {
    const data = validScanFormData()
    data.processes[0].pain_level = 6 as never
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects negative time_per_week', () => {
    const data = validScanFormData()
    data.processes[0].time_per_week = -1
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects wrong type for processes', () => {
    const data = { ...validScanFormData(), processes: 'not an array' }
    const result = scanFormSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

// ===========================================================================
// leadSchema
// ===========================================================================

describe('leadSchema', () => {
  it('accepts valid lead data', () => {
    const result = leadSchema.safeParse(validLeadData())
    expect(result.success).toBe(true)
  })

  it('accepts lead without optional name and company', () => {
    const result = leadSchema.safeParse({
      email: 'test@example.com',
      scan_id: 'scan_123',
      lgpd_consent: true,
      lgpd_consent_at: '2026-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const { email: _, ...data } = validLeadData()
    const result = leadSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const data = { ...validLeadData(), email: 'not-an-email' }
    const result = leadSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects missing scan_id', () => {
    const { scan_id: _, ...data } = validLeadData()
    const result = leadSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects empty scan_id', () => {
    const data = { ...validLeadData(), scan_id: '' }
    const result = leadSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 200 chars', () => {
    const data = { ...validLeadData(), name: 'N'.repeat(201) }
    const result = leadSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects company longer than 200 chars', () => {
    const data = { ...validLeadData(), company: 'C'.repeat(201) }
    const result = leadSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

// ===========================================================================
// businessProfileSchema (Call 1 output — contract test)
// ===========================================================================

describe('businessProfileSchema', () => {
  it('accepts valid business profile', () => {
    const result = businessProfileSchema.safeParse(validBusinessProfile())
    expect(result.success).toBe(true)
  })

  it('rejects missing company_name', () => {
    const { company_name: _, ...data } = validBusinessProfile()
    const result = businessProfileSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects missing key_processes', () => {
    const { key_processes: _, ...data } = validBusinessProfile()
    const result = businessProfileSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects empty key_processes array', () => {
    const data = { ...validBusinessProfile(), key_processes: [] }
    const result = businessProfileSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects missing business_context', () => {
    const { business_context: _, ...data } = validBusinessProfile()
    const result = businessProfileSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

// ===========================================================================
// processMapSchema (Call 2 output — contract test)
// ===========================================================================

describe('processMapSchema', () => {
  it('accepts valid process map', () => {
    const result = processMapSchema.safeParse(validProcessMap())
    expect(result.success).toBe(true)
  })

  it('rejects empty processes array', () => {
    const result = processMapSchema.safeParse({ processes: [] })
    expect(result.success).toBe(false)
  })

  it('rejects process missing automation_potential', () => {
    const data = validProcessMap()
    delete (data.processes[0] as Record<string, unknown>).automation_potential
    const result = processMapSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects automation_potential > 1', () => {
    const data = validProcessMap()
    data.processes[0].automation_potential = 1.5
    const result = processMapSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects automation_potential < 0', () => {
    const data = validProcessMap()
    data.processes[0].automation_potential = -0.1
    const result = processMapSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects process with empty opportunities array', () => {
    const data = validProcessMap()
    data.processes[0].opportunities = []
    const result = processMapSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

// ===========================================================================
// scoredOpportunitiesSchema (Call 3 output — contract test)
// ===========================================================================

describe('scoredOpportunitiesSchema', () => {
  it('accepts valid scored opportunities', () => {
    const result = scoredOpportunitiesSchema.safeParse({
      opportunities: [validScoredOpportunity()],
    })
    expect(result.success).toBe(true)
  })

  it('rejects impact_score outside 1-10', () => {
    const opp = { ...validScoredOpportunity(), impact_score: 0 }
    const result = scoredOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects impact_score above 10', () => {
    const opp = { ...validScoredOpportunity(), impact_score: 11 }
    const result = scoredOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects feasibility_score outside 1-10', () => {
    const opp = { ...validScoredOpportunity(), feasibility_score: 0 }
    const result = scoredOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects effort_score outside 1-10', () => {
    const opp = { ...validScoredOpportunity(), effort_score: 11 }
    const result = scoredOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects roi_score outside 1-10', () => {
    const opp = { ...validScoredOpportunity(), roi_score: -1 }
    const result = scoredOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects missing guardrails', () => {
    const { guardrails: _, ...opp } = validScoredOpportunity()
    const result = scoredOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects empty opportunities array', () => {
    const result = scoredOpportunitiesSchema.safeParse({ opportunities: [] })
    expect(result.success).toBe(false)
  })
})

// ===========================================================================
// rankedOpportunitiesSchema (Call 4 output — contract test)
// ===========================================================================

describe('rankedOpportunitiesSchema', () => {
  it('accepts valid ranked opportunities', () => {
    const result = rankedOpportunitiesSchema.safeParse({
      opportunities: [validRankedOpportunity()],
    })
    expect(result.success).toBe(true)
  })

  it('rejects rank outside 1-10', () => {
    const opp = { ...validRankedOpportunity(), rank: 0 }
    const result = rankedOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects rank above 10', () => {
    const opp = { ...validRankedOpportunity(), rank: 11 }
    const result = rankedOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects negative roi_range_min', () => {
    const opp = { ...validRankedOpportunity(), roi_range_min: -100 }
    const result = rankedOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects missing time_to_value', () => {
    const { time_to_value: _, ...opp } = validRankedOpportunity()
    const result = rankedOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects missing quick_win boolean', () => {
    const { quick_win: _, ...opp } = validRankedOpportunity()
    const result = rankedOpportunitiesSchema.safeParse({ opportunities: [opp] })
    expect(result.success).toBe(false)
  })

  it('rejects empty opportunities array', () => {
    const result = rankedOpportunitiesSchema.safeParse({ opportunities: [] })
    expect(result.success).toBe(false)
  })
})
