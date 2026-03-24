import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface SectorProfile {
  slug: string
  name: string
  keywords: string[]
  typical_processes: string[]
  specific_questions: string[]
  high_roi_opportunities: string[]
}

export interface GenericSector {
  name: string
  universal_questions: string[]
}

export interface SectorProfiles {
  sectors: SectorProfile[]
  generic: GenericSector
}

export interface Opportunity {
  name: string
  typical_roi: string
  effort: string
  time_to_value: string
  applicable_when: string
  tech: string
}

export interface OpportunityCategory {
  key: string
  name: string
  description: string
  opportunities: Opportunity[]
}

export interface OpportunitiesCatalog {
  categories: OpportunityCategory[]
}

export interface ScoringDimension {
  key: string
  weight: number
  description: string
  scale: Record<number, string>
}

export interface CompositeFormula {
  formula: string
  max_score: number
  thresholds: {
    excellent: number
    good: number
    moderate: number
    low: number
    skip: number
  }
}

export interface DecisionMatrixEntry {
  condition: string
  description: string
}

export interface ScoringCriteria {
  dimensions: ScoringDimension[]
  composite_formula: CompositeFormula
  automation_decision_matrix: Record<string, DecisionMatrixEntry>
  guardrails_required: Record<string, string[]>
}

// ---------------------------------------------------------------------------
// YAML file paths
// ---------------------------------------------------------------------------

const DATA_DIR = resolve(process.cwd(), 'ai-scanner/data')

const SECTOR_PROFILES_PATH = resolve(DATA_DIR, 'sector-profiles.yaml')
const OPPORTUNITIES_CATALOG_PATH = resolve(DATA_DIR, 'ai-opportunities-catalog.yaml')
const SCORING_CRITERIA_PATH = resolve(DATA_DIR, 'scoring-criteria.yaml')

// ---------------------------------------------------------------------------
// Module-level cache
// ---------------------------------------------------------------------------

let sectorProfilesCache: SectorProfiles | null = null
let opportunitiesCatalogCache: OpportunitiesCatalog | null = null
let scoringCriteriaCache: ScoringCriteria | null = null

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readYaml<T>(filePath: string): T {
  const raw = readFileSync(filePath, 'utf-8')
  return parse(raw) as T
}

// ---------------------------------------------------------------------------
// Raw YAML shape types (what the YAML parser returns)
// ---------------------------------------------------------------------------

interface RawSectorProfile {
  name: string
  keywords: string[]
  typical_processes: string[]
  specific_questions: string[]
  high_roi_opportunities: string[]
}

interface RawSectorProfilesYaml {
  sectors: Record<string, RawSectorProfile>
  generic: GenericSector
}

interface RawOpportunity {
  name: string
  typical_roi: string
  effort: string
  time_to_value: string
  applicable_when: string
  tech: string
}

interface RawCategory {
  name: string
  description: string
  opportunities: RawOpportunity[]
}

interface RawOpportunitiesYaml {
  categories: Record<string, RawCategory>
}

interface RawDimension {
  weight: number
  description: string
  scale: Record<number, string>
}

interface RawScoringYaml {
  dimensions: Record<string, RawDimension>
  composite_formula: CompositeFormula
  automation_decision_matrix: Record<string, DecisionMatrixEntry>
  guardrails_required: Record<string, string[]>
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load and cache sector profiles from YAML.
 * Returns 8 named sectors + 1 generic fallback.
 */
export function getSectorProfiles(): SectorProfiles {
  if (sectorProfilesCache) return sectorProfilesCache

  const raw = readYaml<RawSectorProfilesYaml>(SECTOR_PROFILES_PATH)

  const sectors: SectorProfile[] = Object.entries(raw.sectors).map(
    ([slug, profile]) => ({
      slug,
      name: profile.name,
      keywords: profile.keywords,
      typical_processes: profile.typical_processes,
      specific_questions: profile.specific_questions,
      high_roi_opportunities: profile.high_roi_opportunities,
    }),
  )

  sectorProfilesCache = {
    sectors,
    generic: raw.generic,
  }

  return sectorProfilesCache
}

/**
 * Load and cache the AI opportunities catalog from YAML.
 * Returns 5 categories with a total of 22 opportunities.
 */
export function getOpportunitiesCatalog(): OpportunitiesCatalog {
  if (opportunitiesCatalogCache) return opportunitiesCatalogCache

  const raw = readYaml<RawOpportunitiesYaml>(OPPORTUNITIES_CATALOG_PATH)

  const categories: OpportunityCategory[] = Object.entries(raw.categories).map(
    ([key, cat]) => ({
      key,
      name: cat.name,
      description: cat.description,
      opportunities: cat.opportunities.map((opp) => ({
        name: opp.name,
        typical_roi: opp.typical_roi,
        effort: opp.effort,
        time_to_value: opp.time_to_value,
        applicable_when: opp.applicable_when,
        tech: opp.tech,
      })),
    }),
  )

  opportunitiesCatalogCache = { categories }

  return opportunitiesCatalogCache
}

/**
 * Load and cache scoring criteria from YAML.
 * Returns 4 dimensions, composite formula, decision matrix, and guardrails.
 */
export function getScoringCriteria(): ScoringCriteria {
  if (scoringCriteriaCache) return scoringCriteriaCache

  const raw = readYaml<RawScoringYaml>(SCORING_CRITERIA_PATH)

  const dimensions: ScoringDimension[] = Object.entries(raw.dimensions).map(
    ([key, dim]) => ({
      key,
      weight: dim.weight,
      description: dim.description,
      scale: dim.scale,
    }),
  )

  scoringCriteriaCache = {
    dimensions,
    composite_formula: raw.composite_formula,
    automation_decision_matrix: raw.automation_decision_matrix,
    guardrails_required: raw.guardrails_required,
  }

  return scoringCriteriaCache
}

/**
 * Look up a specific sector by slug.
 * Falls back to a generic-compatible shape if the slug is not found.
 */
export function getSectorBySlug(slug: string): SectorProfile | GenericSector {
  const profiles = getSectorProfiles()
  const found = profiles.sectors.find((s) => s.slug === slug)
  return found ?? profiles.generic
}
