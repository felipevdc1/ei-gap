import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the data loader before importing the module under test
vi.mock('@/lib/data/loader', () => ({
  getSectorBySlug: vi.fn((slug: string) => {
    if (slug === 'ecommerce') {
      return {
        slug: 'ecommerce',
        name: 'E-commerce',
        keywords: ['loja virtual', 'marketplace'],
        typical_processes: ['atendimento ao cliente', 'gestao de estoque'],
        specific_questions: ['Quantos pedidos por mes?'],
        high_roi_opportunities: ['Automacao de atendimento', 'Gestao de estoque com IA'],
      }
    }
    // generic fallback
    return {
      name: 'Generico',
      universal_questions: ['Qual o principal processo da empresa?'],
    }
  }),
  getScoringCriteria: vi.fn(() => ({
    dimensions: [
      { key: 'impact', weight: 0.35, description: 'Quanto impacta o resultado do negocio', scale: {} },
      { key: 'effort', weight: 0.25, description: 'Quanto esforco pra implementar', scale: {} },
      { key: 'feasibility', weight: 0.20, description: 'Viabilidade tecnica', scale: {} },
      { key: 'automation_readiness', weight: 0.20, description: 'Prontidao pra automacao', scale: {} },
    ],
    composite_formula: {
      formula: '(impact * 0.35) + (effort_inverted * 0.25) + (feasibility * 0.20) + (automation_readiness * 0.20)',
      max_score: 10,
      thresholds: { excellent: 8.5, good: 7, moderate: 5, low: 3, skip: 0 },
    },
    automation_decision_matrix: {},
    guardrails_required: {},
  })),
}))

import {
  getIntakePrompt,
  getExtractionPrompt,
  getScoringPrompt,
  getRankingPrompt,
  getReportPrompt,
} from '../prompts'

// ---------------------------------------------------------------------------
// Shared section validators
// ---------------------------------------------------------------------------

function expectContainsSection(prompt: string, sectionName: string) {
  const upper = sectionName.toUpperCase()
  expect(prompt.toUpperCase()).toContain(upper)
}

// ---------------------------------------------------------------------------
// Call 1 — getIntakePrompt (scanner-chief intake)
// ---------------------------------------------------------------------------
describe('getIntakePrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = getIntakePrompt('ecommerce')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('contains PERSONA section', () => {
    const prompt = getIntakePrompt('ecommerce')
    expectContainsSection(prompt, 'PERSONA')
  })

  it('contains THINKING DNA section', () => {
    const prompt = getIntakePrompt('ecommerce')
    expectContainsSection(prompt, 'THINKING DNA')
  })

  it('includes sector-specific data from getSectorBySlug for known sectors', () => {
    const prompt = getIntakePrompt('ecommerce')
    expect(prompt).toContain('E-commerce')
    expect(prompt).toContain('atendimento ao cliente')
  })

  it('includes sector-specific questions', () => {
    const prompt = getIntakePrompt('ecommerce')
    expect(prompt).toContain('Quantos pedidos por mes?')
  })

  it('works with generic/unknown sector slugs', () => {
    const prompt = getIntakePrompt('unknown_sector')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
    expect(prompt).toContain('Generico')
  })

  it('includes scanner-chief identity elements', () => {
    const prompt = getIntakePrompt('ecommerce')
    expect(prompt).toContain('AI Scanner')
    expect(prompt).toContain('Diagnostic')
  })
})

// ---------------------------------------------------------------------------
// Call 2 — getExtractionPrompt (business-analyst)
// ---------------------------------------------------------------------------
describe('getExtractionPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = getExtractionPrompt('ecommerce')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('contains PERSONA section', () => {
    const prompt = getExtractionPrompt('ecommerce')
    expectContainsSection(prompt, 'PERSONA')
  })

  it('contains THINKING DNA section', () => {
    const prompt = getExtractionPrompt('ecommerce')
    expectContainsSection(prompt, 'THINKING DNA')
  })

  it('contains HEURISTICS section', () => {
    const prompt = getExtractionPrompt('ecommerce')
    expectContainsSection(prompt, 'HEURISTICS')
  })

  it('includes Knowledge Extraction framework', () => {
    const prompt = getExtractionPrompt('ecommerce')
    expect(prompt).toContain('Knowledge Extraction')
  })

  it('includes Pareto ao Cubo framework', () => {
    const prompt = getExtractionPrompt('ecommerce')
    expect(prompt).toContain('Pareto')
  })

  it('includes Curadoria Ouro/Bronze concept', () => {
    const prompt = getExtractionPrompt('ecommerce')
    expect(prompt.toLowerCase()).toContain('ouro')
    expect(prompt.toLowerCase()).toContain('bronze')
  })

  it('includes business-analyst identity', () => {
    const prompt = getExtractionPrompt('ecommerce')
    expect(prompt).toContain('Business Analyst')
    expect(prompt).toContain('Knowledge Miner')
  })
})

// ---------------------------------------------------------------------------
// Call 3 — getScoringPrompt (process-architect)
// ---------------------------------------------------------------------------
describe('getScoringPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = getScoringPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('contains PERSONA section', () => {
    const prompt = getScoringPrompt()
    expectContainsSection(prompt, 'PERSONA')
  })

  it('contains THINKING DNA section', () => {
    const prompt = getScoringPrompt()
    expectContainsSection(prompt, 'THINKING DNA')
  })

  it('includes Scoring Engine / 4D scoring', () => {
    const prompt = getScoringPrompt()
    expect(prompt).toContain('Scoring')
    // should reference the 4 dimensions
    expect(prompt).toContain('impact')
    expect(prompt).toContain('effort')
    expect(prompt).toContain('feasibility')
    expect(prompt).toContain('automation_readiness')
  })

  it('includes Diagnostic Framework concepts', () => {
    const prompt = getScoringPrompt()
    expect(prompt).toContain('Diagnostic')
  })

  it('includes process-architect identity', () => {
    const prompt = getScoringPrompt()
    expect(prompt).toContain('Process Architect')
  })

  it('includes guardrails concept', () => {
    const prompt = getScoringPrompt()
    expect(prompt.toLowerCase()).toContain('guardrail')
  })

  it('includes scoring criteria data', () => {
    const prompt = getScoringPrompt()
    // composite formula reference
    expect(prompt).toContain('0.35')
    expect(prompt).toContain('0.25')
    expect(prompt).toContain('0.20')
  })
})

// ---------------------------------------------------------------------------
// Call 4 — getRankingPrompt (growth-strategist)
// ---------------------------------------------------------------------------
describe('getRankingPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = getRankingPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('contains PERSONA section', () => {
    const prompt = getRankingPrompt()
    expectContainsSection(prompt, 'PERSONA')
  })

  it('contains THINKING DNA section', () => {
    const prompt = getRankingPrompt()
    expectContainsSection(prompt, 'THINKING DNA')
  })

  it('includes Funnel Logic', () => {
    const prompt = getRankingPrompt()
    expect(prompt).toContain('Funnel')
  })

  it('includes Loss Aversion 2.5:1', () => {
    const prompt = getRankingPrompt()
    expect(prompt).toContain('Loss Aversion')
    expect(prompt).toContain('2.5')
  })

  it('includes Dopamine Engineering', () => {
    const prompt = getRankingPrompt()
    expect(prompt).toContain('Dopamine')
  })

  it('includes growth-strategist identity', () => {
    const prompt = getRankingPrompt()
    expect(prompt).toContain('Growth Strategist')
    expect(prompt).toContain('Revenue Architect')
  })
})

// ---------------------------------------------------------------------------
// Call 5 — getReportPrompt (scanner-chief report)
// ---------------------------------------------------------------------------
describe('getReportPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = getReportPrompt()
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('contains PERSONA section', () => {
    const prompt = getReportPrompt()
    expectContainsSection(prompt, 'PERSONA')
  })

  it('contains strategic barrier rules', () => {
    const prompt = getReportPrompt()
    // FREE tier keywords
    expect(prompt).toContain('O QUE')
    expect(prompt).toContain('POR QUE')
    expect(prompt).toContain('QUANTO')
    expect(prompt).toContain('QUANDO')
  })

  it('contains NUNCA rules (what to exclude)', () => {
    const prompt = getReportPrompt()
    expect(prompt).toContain('NUNCA')
    expect(prompt).toContain('COMO')
  })

  it('contains report template', () => {
    const prompt = getReportPrompt()
    // Key markers from report-tmpl.md
    expect(prompt).toContain('Top 10 Oportunidades')
    expect(prompt).toContain('Proximo Passo')
    expect(prompt).toContain('Custo de Nao Agir')
  })

  it('contains scanner-chief identity elements', () => {
    const prompt = getReportPrompt()
    expect(prompt).toContain('AI Scanner')
  })

  it('contains strategic barrier terms for free vs paid', () => {
    const prompt = getReportPrompt()
    // Must contain terms about what NOT to include
    expect(prompt.toLowerCase()).toContain('stack')
    expect(prompt.toLowerCase()).toContain('cronograma')
    expect(prompt.toLowerCase()).toContain('prompts')
  })
})
