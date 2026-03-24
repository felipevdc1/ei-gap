// ---------------------------------------------------------------------------
// EI-GAP AI Scanner — Core Type Definitions
// ---------------------------------------------------------------------------

/** Company size buckets for the scan form */
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+'

/** Technology maturity level */
export type TechMaturity = 'low' | 'medium' | 'high'

/** Status of a scan through its lifecycle */
export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed'

/** Phase event types emitted during scan processing */
export type PhaseEventType =
  | 'phase_start'
  | 'phase_complete'
  | 'phase_retry'
  | 'scan_complete'
  | 'scan_error'

// ---------------------------------------------------------------------------
// Input types (user-facing)
// ---------------------------------------------------------------------------

/** Process entry as submitted by the user in the scan form */
export interface ScanFormProcess {
  name: string
  time_per_week: number
  pain_level: 1 | 2 | 3 | 4 | 5
}

/** Data submitted via the initial scan form */
export interface ScanFormData {
  sector: string
  company_name: string
  company_size: CompanySize
  tech_maturity: TechMaturity
  current_tools?: string
  sector_answers: Record<string, string>
  processes: ScanFormProcess[]
}

/** Lead capture data submitted after scan completion */
export interface LeadData {
  email: string
  name?: string
  company?: string
  scan_id: string
}

// ---------------------------------------------------------------------------
// Pipeline intermediate types (AI call outputs)
// ---------------------------------------------------------------------------

/** Output of Call 1 — Business Profile Analysis */
export interface BusinessProfile {
  company_name: string
  sector: string
  company_size: string
  tech_maturity: string
  detected_sector: string
  key_processes: string[]
  business_context: string
}

/** Single process entry in the process map (Call 2 output) */
export interface ProcessMapEntry {
  name: string
  category: string
  time_per_week: number
  pain_level: number
  automation_potential: number
  opportunities: string[]
}

/** Output of Call 2 — Process Mapping */
export interface ProcessMap {
  processes: ProcessMapEntry[]
}

/** Output of Call 3 — Scored Opportunity */
export interface ScoredOpportunity {
  name: string
  description: string
  category: string
  impact_score: number
  feasibility_score: number
  effort_score: number
  roi_score: number
  composite_score: number
  guardrails: string[]
}

/** Output of Call 4 — Ranked Opportunity (extends ScoredOpportunity) */
export interface RankedOpportunity extends ScoredOpportunity {
  rank: number
  roi_range_min: number
  roi_range_max: number
  loss_per_month: number
  time_to_value: string
  quick_win: boolean
}

// ---------------------------------------------------------------------------
// Final output types
// ---------------------------------------------------------------------------

/** Output of Call 5 — Complete Scan Report */
export interface ScanReport {
  id: string
  scan_id: string
  executive_summary: string
  opportunities: RankedOpportunity[]
  total_roi_min: number
  total_roi_max: number
  cost_of_inaction_monthly: number
  gains_summary: string
  losses_summary: string
  sector: string
  company_name: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Event emitted during scan processing for real-time UI updates */
export interface PhaseEvent {
  type: PhaseEventType
  phase: number
  name: string
  duration_ms?: number
  attempt?: number
  reason?: string
  reportId?: string
  error?: string
}
