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

// Pipeline schemas are intentionally LENIENT to accommodate LLM output variance.
// LLMs (especially free-tier models) return slightly different structures each time.
// We validate the MINIMUM required fields and passthrough everything else.

export const businessProfileSchema = z.object({
  company_name: z.string().optional().default(''),
  sector: z.string().optional().default(''),
  company_size: z.string().optional().default(''),
  tech_maturity: z.string().optional().default(''),
  detected_sector: z.string().optional().default(''),
  key_processes: z.union([
    z.array(z.string()),
    z.array(z.object({ name: z.string() }).passthrough()),
    z.array(z.any()),
  ]).optional().default([]),
  business_context: z.string().optional().default(''),
}).passthrough()

const processMapEntrySchema = z.object({
  name: z.string().min(1),
  category: z.string().optional().default('general'),
  time_per_week: z.number().optional().default(0),
  pain_level: z.number().optional().default(3),
  automation_potential: z.number().optional().default(0.5),
  opportunities: z.union([
    z.array(z.string()),
    z.array(z.any()),
  ]).optional().default([]),
}).passthrough()

export const processMapSchema = z.object({
  processes: z.array(processMapEntrySchema).min(1),
}).passthrough()

const scoredOpportunitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  category: z.string().optional().default('general'),
  impact_score: z.number().optional().default(5),
  feasibility_score: z.number().optional().default(5),
  effort_score: z.number().optional().default(5),
  roi_score: z.number().optional().default(5),
  composite_score: z.number().optional().default(5),
  guardrails: z.array(z.string()).optional().default([]),
}).passthrough()

export const scoredOpportunitiesSchema = z.object({
  opportunities: z.array(scoredOpportunitySchema).min(1),
}).passthrough()

const rankedOpportunitySchema = scoredOpportunitySchema.extend({
  rank: z.number().optional().default(1),
  roi_range_min: z.number().optional().default(0),
  roi_range_max: z.number().optional().default(0),
  loss_per_month: z.number().optional().default(0),
  time_to_value: z.string().optional().default('3-6 meses'),
  quick_win: z.boolean().optional().default(false),
})

export const rankedOpportunitiesSchema = z.object({
  opportunities: z.array(rankedOpportunitySchema).min(1),
}).passthrough()

// ---------------------------------------------------------------------------
// Inferred types (for use when you want types derived from schemas)
// ---------------------------------------------------------------------------

export type ScanFormDataInput = z.infer<typeof scanFormSchema>
export type LeadDataInput = z.infer<typeof leadSchema>
export type BusinessProfileOutput = z.infer<typeof businessProfileSchema>
export type ProcessMapOutput = z.infer<typeof processMapSchema>
export type ScoredOpportunitiesOutput = z.infer<typeof scoredOpportunitiesSchema>
export type RankedOpportunitiesOutput = z.infer<typeof rankedOpportunitiesSchema>
