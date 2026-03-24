import { describe, it, expectTypeOf } from 'vitest'
import type {
  BusinessProfile,
  ScoredOpportunity,
  RankedOpportunity,
  ScanReport,
  ScanFormData,
  LeadData,
  PhaseEvent,
  ScanStatus,
  ProcessMap,
  ProcessMapEntry,
} from '../scanner'

// ===========================================================================
// Type-level tests — these verify the TypeScript interfaces exist and have
// the expected shape. They compile-check only; no runtime assertions needed.
// ===========================================================================

describe('Scanner type definitions', () => {
  it('ScanFormData has required fields', () => {
    expectTypeOf<ScanFormData>().toHaveProperty('sector')
    expectTypeOf<ScanFormData>().toHaveProperty('company_name')
    expectTypeOf<ScanFormData>().toHaveProperty('company_size')
    expectTypeOf<ScanFormData>().toHaveProperty('tech_maturity')
    expectTypeOf<ScanFormData>().toHaveProperty('current_tools')
    expectTypeOf<ScanFormData>().toHaveProperty('sector_answers')
    expectTypeOf<ScanFormData>().toHaveProperty('processes')
  })

  it('LeadData has required fields', () => {
    expectTypeOf<LeadData>().toHaveProperty('email')
    expectTypeOf<LeadData>().toHaveProperty('scan_id')
    expectTypeOf<LeadData>().toHaveProperty('name')
    expectTypeOf<LeadData>().toHaveProperty('company')
  })

  it('BusinessProfile has required fields', () => {
    expectTypeOf<BusinessProfile>().toHaveProperty('company_name')
    expectTypeOf<BusinessProfile>().toHaveProperty('sector')
    expectTypeOf<BusinessProfile>().toHaveProperty('company_size')
    expectTypeOf<BusinessProfile>().toHaveProperty('tech_maturity')
    expectTypeOf<BusinessProfile>().toHaveProperty('detected_sector')
    expectTypeOf<BusinessProfile>().toHaveProperty('key_processes')
    expectTypeOf<BusinessProfile>().toHaveProperty('business_context')
  })

  it('ProcessMap has processes array', () => {
    expectTypeOf<ProcessMap>().toHaveProperty('processes')
  })

  it('ProcessMapEntry has required fields', () => {
    expectTypeOf<ProcessMapEntry>().toHaveProperty('name')
    expectTypeOf<ProcessMapEntry>().toHaveProperty('category')
    expectTypeOf<ProcessMapEntry>().toHaveProperty('time_per_week')
    expectTypeOf<ProcessMapEntry>().toHaveProperty('pain_level')
    expectTypeOf<ProcessMapEntry>().toHaveProperty('automation_potential')
    expectTypeOf<ProcessMapEntry>().toHaveProperty('opportunities')
  })

  it('ScoredOpportunity has score fields', () => {
    expectTypeOf<ScoredOpportunity>().toHaveProperty('name')
    expectTypeOf<ScoredOpportunity>().toHaveProperty('description')
    expectTypeOf<ScoredOpportunity>().toHaveProperty('category')
    expectTypeOf<ScoredOpportunity>().toHaveProperty('impact_score')
    expectTypeOf<ScoredOpportunity>().toHaveProperty('feasibility_score')
    expectTypeOf<ScoredOpportunity>().toHaveProperty('effort_score')
    expectTypeOf<ScoredOpportunity>().toHaveProperty('roi_score')
    expectTypeOf<ScoredOpportunity>().toHaveProperty('composite_score')
    expectTypeOf<ScoredOpportunity>().toHaveProperty('guardrails')
  })

  it('RankedOpportunity extends ScoredOpportunity with ranking fields', () => {
    expectTypeOf<RankedOpportunity>().toHaveProperty('rank')
    expectTypeOf<RankedOpportunity>().toHaveProperty('roi_range_min')
    expectTypeOf<RankedOpportunity>().toHaveProperty('roi_range_max')
    expectTypeOf<RankedOpportunity>().toHaveProperty('loss_per_month')
    expectTypeOf<RankedOpportunity>().toHaveProperty('time_to_value')
    expectTypeOf<RankedOpportunity>().toHaveProperty('quick_win')
    // Also has ScoredOpportunity fields
    expectTypeOf<RankedOpportunity>().toHaveProperty('impact_score')
    expectTypeOf<RankedOpportunity>().toHaveProperty('composite_score')
  })

  it('ScanReport has all report fields', () => {
    expectTypeOf<ScanReport>().toHaveProperty('id')
    expectTypeOf<ScanReport>().toHaveProperty('scan_id')
    expectTypeOf<ScanReport>().toHaveProperty('executive_summary')
    expectTypeOf<ScanReport>().toHaveProperty('opportunities')
    expectTypeOf<ScanReport>().toHaveProperty('total_roi_min')
    expectTypeOf<ScanReport>().toHaveProperty('total_roi_max')
    expectTypeOf<ScanReport>().toHaveProperty('cost_of_inaction_monthly')
    expectTypeOf<ScanReport>().toHaveProperty('gains_summary')
    expectTypeOf<ScanReport>().toHaveProperty('losses_summary')
    expectTypeOf<ScanReport>().toHaveProperty('sector')
    expectTypeOf<ScanReport>().toHaveProperty('company_name')
    expectTypeOf<ScanReport>().toHaveProperty('created_at')
  })

  it('PhaseEvent has correct type union', () => {
    expectTypeOf<PhaseEvent>().toHaveProperty('type')
    expectTypeOf<PhaseEvent>().toHaveProperty('phase')
    expectTypeOf<PhaseEvent>().toHaveProperty('name')
  })

  it('ScanStatus is a string union type', () => {
    expectTypeOf<'pending'>().toMatchTypeOf<ScanStatus>()
    expectTypeOf<'processing'>().toMatchTypeOf<ScanStatus>()
    expectTypeOf<'completed'>().toMatchTypeOf<ScanStatus>()
    expectTypeOf<'failed'>().toMatchTypeOf<ScanStatus>()
  })

  it('ScanStatus rejects invalid values', () => {
    expectTypeOf<'invalid'>().not.toMatchTypeOf<ScanStatus>()
  })
})
