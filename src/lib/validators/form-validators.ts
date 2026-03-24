import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared constraints
// ---------------------------------------------------------------------------

const MAX_NAME = 200
const MAX_TEXTAREA = 500

const score1to10 = z.number().int().min(1).max(10)
const score1to5 = z.number().int().min(1).max(5)

// ---------------------------------------------------------------------------
// Input schemas (user-facing)
// ---------------------------------------------------------------------------

const scanFormProcessSchema = z.object({
  name: z.string().min(1),
  time_per_week: z.number().min(0),
  pain_level: score1to5,
})

export const scanFormSchema = z.object({
  sector: z.string().min(1),
  company_name: z.string().min(1).max(MAX_NAME),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']),
  tech_maturity: z.enum(['low', 'medium', 'high']),
  current_tools: z.string().max(MAX_TEXTAREA).optional(),
  sector_answers: z.record(z.string(), z.string().max(MAX_TEXTAREA)),
  processes: z.array(scanFormProcessSchema).min(3).max(10),
})

export const leadSchema = z.object({
  email: z.string().email(),
  name: z.string().max(MAX_NAME).optional(),
  company: z.string().max(MAX_NAME).optional(),
  scan_id: z.string().min(1),
  lgpd_consent: z.literal(true, {
    error: 'LGPD consent is required',
  }),
  lgpd_consent_at: z.string().datetime(),
})

// ---------------------------------------------------------------------------
// Intermediate pipeline schemas (contract tests between AI calls)
// ---------------------------------------------------------------------------

export const businessProfileSchema = z.object({
  company_name: z.string().min(1),
  sector: z.string().min(1),
  company_size: z.string().min(1),
  tech_maturity: z.string().min(1),
  detected_sector: z.string().min(1),
  key_processes: z.array(z.string().min(1)).min(1),
  business_context: z.string().min(1),
})

const processMapEntrySchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  time_per_week: z.number().min(0),
  pain_level: z.number().int().min(1).max(5),
  automation_potential: z.number().min(0).max(1),
  opportunities: z.array(z.string().min(1)).min(1),
})

export const processMapSchema = z.object({
  processes: z.array(processMapEntrySchema).min(1),
})

const scoredOpportunitySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  impact_score: score1to10,
  feasibility_score: score1to10,
  effort_score: score1to10,
  roi_score: score1to10,
  composite_score: z.number(),
  guardrails: z.array(z.string()),
})

export const scoredOpportunitiesSchema = z.object({
  opportunities: z.array(scoredOpportunitySchema).min(1),
})

const rankedOpportunitySchema = scoredOpportunitySchema.extend({
  rank: score1to10,
  roi_range_min: z.number().min(0),
  roi_range_max: z.number().min(0),
  loss_per_month: z.number(),
  time_to_value: z.string().min(1),
  quick_win: z.boolean(),
})

export const rankedOpportunitiesSchema = z.object({
  opportunities: z.array(rankedOpportunitySchema).min(1),
})

// ---------------------------------------------------------------------------
// Inferred types (for use when you want types derived from schemas)
// ---------------------------------------------------------------------------

export type ScanFormDataInput = z.infer<typeof scanFormSchema>
export type LeadDataInput = z.infer<typeof leadSchema>
export type BusinessProfileOutput = z.infer<typeof businessProfileSchema>
export type ProcessMapOutput = z.infer<typeof processMapSchema>
export type ScoredOpportunitiesOutput = z.infer<typeof scoredOpportunitiesSchema>
export type RankedOpportunitiesOutput = z.infer<typeof rankedOpportunitiesSchema>
