import { describe, it, expect, beforeEach } from 'vitest'

// We'll import the module under test — doesn't exist yet (RED phase)
import {
  getSectorProfiles,
  getOpportunitiesCatalog,
  getScoringCriteria,
  getSectorBySlug,
} from '../loader'

// ---------------------------------------------------------------------------
// getSectorProfiles()
// ---------------------------------------------------------------------------
describe('getSectorProfiles', () => {
  it('returns all 8 named sectors plus the generic sector', () => {
    const profiles = getSectorProfiles()
    // 8 sectors under "sectors" key + 1 generic = 9 total
    expect(profiles.sectors).toHaveLength(8)
    expect(profiles.generic).toBeDefined()
  })

  it('contains the expected sector slugs', () => {
    const profiles = getSectorProfiles()
    const slugs = profiles.sectors.map((s) => s.slug)
    expect(slugs).toEqual(
      expect.arrayContaining([
        'ecommerce',
        'agencia_marketing',
        'saas',
        'servicos_profissionais',
        'varejo_fisico',
        'industria',
        'educacao',
        'saude',
      ]),
    )
  })

  it('each sector has name, keywords, typical_processes, specific_questions, and high_roi_opportunities', () => {
    const profiles = getSectorProfiles()
    for (const sector of profiles.sectors) {
      expect(sector.name).toBeTruthy()
      expect(sector.slug).toBeTruthy()
      expect(Array.isArray(sector.keywords)).toBe(true)
      expect(sector.keywords.length).toBeGreaterThan(0)
      expect(Array.isArray(sector.typical_processes)).toBe(true)
      expect(sector.typical_processes.length).toBeGreaterThan(0)
      expect(Array.isArray(sector.specific_questions)).toBe(true)
      expect(sector.specific_questions.length).toBeGreaterThan(0)
      expect(Array.isArray(sector.high_roi_opportunities)).toBe(true)
      expect(sector.high_roi_opportunities.length).toBeGreaterThan(0)
    }
  })

  it('generic sector has name and universal_questions', () => {
    const profiles = getSectorProfiles()
    expect(profiles.generic.name).toBe('Negocio Geral')
    expect(Array.isArray(profiles.generic.universal_questions)).toBe(true)
    expect(profiles.generic.universal_questions.length).toBeGreaterThan(0)
  })

  it('returns cached data on subsequent calls (same reference)', () => {
    const first = getSectorProfiles()
    const second = getSectorProfiles()
    expect(first).toBe(second)
  })
})

// ---------------------------------------------------------------------------
// getOpportunitiesCatalog()
// ---------------------------------------------------------------------------
describe('getOpportunitiesCatalog', () => {
  it('returns all 5 categories', () => {
    const catalog = getOpportunitiesCatalog()
    expect(catalog.categories).toHaveLength(5)
    const categoryKeys = catalog.categories.map((c) => c.key)
    expect(categoryKeys).toEqual(
      expect.arrayContaining([
        'automacao',
        'analise',
        'geracao',
        'integracao',
        'decisao',
      ]),
    )
  })

  it('returns a total of 22 opportunities across all categories', () => {
    const catalog = getOpportunitiesCatalog()
    const total = catalog.categories.reduce(
      (sum, cat) => sum + cat.opportunities.length,
      0,
    )
    expect(total).toBe(22)
  })

  it('each opportunity has name, typical_roi, effort, time_to_value, applicable_when, tech', () => {
    const catalog = getOpportunitiesCatalog()
    for (const category of catalog.categories) {
      for (const opp of category.opportunities) {
        expect(opp.name).toBeTruthy()
        expect(opp.typical_roi).toBeTruthy()
        expect(opp.effort).toBeTruthy()
        expect(opp.time_to_value).toBeTruthy()
        expect(opp.applicable_when).toBeTruthy()
        expect(opp.tech).toBeTruthy()
      }
    }
  })

  it('each category has name and description', () => {
    const catalog = getOpportunitiesCatalog()
    for (const category of catalog.categories) {
      expect(category.name).toBeTruthy()
      expect(category.description).toBeTruthy()
    }
  })

  it('returns cached data on subsequent calls (same reference)', () => {
    const first = getOpportunitiesCatalog()
    const second = getOpportunitiesCatalog()
    expect(first).toBe(second)
  })
})

// ---------------------------------------------------------------------------
// getScoringCriteria()
// ---------------------------------------------------------------------------
describe('getScoringCriteria', () => {
  it('returns 4 scoring dimensions', () => {
    const criteria = getScoringCriteria()
    expect(criteria.dimensions).toHaveLength(4)
    const dimensionKeys = criteria.dimensions.map((d) => d.key)
    expect(dimensionKeys).toEqual(
      expect.arrayContaining([
        'impact',
        'effort',
        'feasibility',
        'automation_readiness',
      ]),
    )
  })

  it('each dimension has weight, description, and scale entries', () => {
    const criteria = getScoringCriteria()
    for (const dim of criteria.dimensions) {
      expect(dim.weight).toBeGreaterThan(0)
      expect(dim.weight).toBeLessThanOrEqual(1)
      expect(dim.description).toBeTruthy()
      expect(Object.keys(dim.scale).length).toBe(10) // 1-10 scale
    }
  })

  it('dimension weights sum to 1.0', () => {
    const criteria = getScoringCriteria()
    const totalWeight = criteria.dimensions.reduce((sum, d) => sum + d.weight, 0)
    expect(totalWeight).toBeCloseTo(1.0, 5)
  })

  it('has composite formula with thresholds', () => {
    const criteria = getScoringCriteria()
    expect(criteria.composite_formula).toBeDefined()
    expect(criteria.composite_formula.formula).toBeTruthy()
    expect(criteria.composite_formula.max_score).toBe(10.0)
    expect(criteria.composite_formula.thresholds).toBeDefined()
    expect(criteria.composite_formula.thresholds.excellent).toBe(8.5)
    expect(criteria.composite_formula.thresholds.good).toBe(7.0)
    expect(criteria.composite_formula.thresholds.moderate).toBe(5.5)
    expect(criteria.composite_formula.thresholds.low).toBe(4.0)
    expect(criteria.composite_formula.thresholds.skip).toBe(0.0)
  })

  it('has automation decision matrix with 4 decisions', () => {
    const criteria = getScoringCriteria()
    expect(criteria.automation_decision_matrix).toBeDefined()
    const decisions = Object.keys(criteria.automation_decision_matrix)
    expect(decisions).toHaveLength(4)
    expect(decisions).toEqual(
      expect.arrayContaining(['AUTOMATE', 'DELEGATE', 'KEEP_MANUAL', 'ELIMINATE']),
    )
  })

  it('has guardrails_required with 3 categories', () => {
    const criteria = getScoringCriteria()
    expect(criteria.guardrails_required).toBeDefined()
    const categories = Object.keys(criteria.guardrails_required)
    expect(categories).toHaveLength(3)
    expect(categories).toEqual(
      expect.arrayContaining(['any_automation', 'high_impact', 'customer_facing']),
    )
  })

  it('returns cached data on subsequent calls (same reference)', () => {
    const first = getScoringCriteria()
    const second = getScoringCriteria()
    expect(first).toBe(second)
  })
})

// ---------------------------------------------------------------------------
// getSectorBySlug()
// ---------------------------------------------------------------------------
describe('getSectorBySlug', () => {
  it('returns the correct sector for a valid slug', () => {
    const sector = getSectorBySlug('ecommerce')
    expect(sector.slug).toBe('ecommerce')
    expect(sector.name).toBe('E-commerce')
  })

  it('returns varejo_fisico sector', () => {
    const sector = getSectorBySlug('varejo_fisico')
    expect(sector.slug).toBe('varejo_fisico')
    expect(sector.name).toBe('Varejo Fisico')
  })

  it('returns generic sector as fallback for nonexistent slug', () => {
    const sector = getSectorBySlug('nonexistent')
    expect(sector.name).toBe('Negocio Geral')
  })

  it('returns generic sector for empty string', () => {
    const sector = getSectorBySlug('')
    expect(sector.name).toBe('Negocio Geral')
  })
})
