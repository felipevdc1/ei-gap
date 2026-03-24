/**
 * @vitest-environment node
 *
 * E5.S1 — Structural validation of the initial schema migration.
 * These tests parse the SQL file and assert that all required
 * tables, indices, RLS policies, triggers, and constraints are defined.
 *
 * TDD: Written BEFORE the migration SQL exists.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MIGRATION_PATH = resolve(
  __dirname,
  '..',
  'migrations',
  '001_initial_schema.sql',
)

let sql: string

beforeAll(() => {
  sql = readFileSync(MIGRATION_PATH, 'utf-8')
})

// ---------- helpers ----------

/** Case-insensitive match that ignores extra whitespace */
function sqlContains(pattern: string): boolean {
  const normalized = sql.replace(/\s+/g, ' ').toLowerCase()
  const normalizedPattern = pattern.replace(/\s+/g, ' ').toLowerCase()
  return normalized.includes(normalizedPattern)
}

function sqlMatches(regex: RegExp): boolean {
  return regex.test(sql)
}

// ---------- Tables ----------

describe('Tables', () => {
  it('creates the scans table', () => {
    expect(sqlContains('create table scans')).toBe(true)
  })

  it('creates the reports table', () => {
    expect(sqlContains('create table reports')).toBe(true)
  })

  it('creates the leads table', () => {
    expect(sqlContains('create table leads')).toBe(true)
  })
})

// ---------- Scans table columns ----------

describe('scans table columns', () => {
  it('has id text primary key', () => {
    expect(sqlMatches(/id\s+text\s+primary\s+key/i)).toBe(true)
  })

  it('has sector text not null', () => {
    expect(sqlMatches(/sector\s+text\s+not\s+null/i)).toBe(true)
  })

  it('has company_name text', () => {
    expect(sqlContains('company_name text')).toBe(true)
  })

  it('has company_size text', () => {
    expect(sqlContains('company_size text')).toBe(true)
  })

  it('has form_data jsonb not null', () => {
    expect(sqlMatches(/form_data\s+jsonb\s+not\s+null/i)).toBe(true)
  })

  it('has status text not null with default pending', () => {
    expect(
      sqlMatches(/status\s+text\s+not\s+null\s+default\s+'pending'/i),
    ).toBe(true)
  })

  it('has error jsonb', () => {
    expect(sqlContains('error jsonb')).toBe(true)
  })

  it('has duration_ms integer', () => {
    expect(sqlContains('duration_ms integer')).toBe(true)
  })

  it('has ip_hash text (hashed, not raw IP)', () => {
    expect(sqlContains('ip_hash text')).toBe(true)
  })

  it('has created_at timestamptz with default now()', () => {
    expect(
      sqlMatches(/created_at\s+timestamptz\s+default\s+now\(\)/i),
    ).toBe(true)
  })

  it('has updated_at timestamptz with default now()', () => {
    expect(
      sqlMatches(/updated_at\s+timestamptz\s+default\s+now\(\)/i),
    ).toBe(true)
  })
})

// ---------- Reports table columns ----------

describe('reports table columns', () => {
  it('has id text primary key', () => {
    // Match within reports table context
    expect(sqlContains('create table reports')).toBe(true)
    expect(sqlMatches(/reports[\s\S]*?id\s+text\s+primary\s+key/i)).toBe(true)
  })

  it('has scan_id referencing scans(id)', () => {
    expect(sqlMatches(/scan_id\s+text\s+references\s+scans\s*\(\s*id\s*\)/i)).toBe(true)
  })

  it('has content jsonb not null', () => {
    expect(sqlMatches(/content\s+jsonb\s+not\s+null/i)).toBe(true)
  })

  it('has status with default processing', () => {
    expect(
      sqlMatches(/status\s+text\s+not\s+null\s+default\s+'processing'/i),
    ).toBe(true)
  })

  it('has total_roi_min numeric', () => {
    expect(sqlContains('total_roi_min numeric')).toBe(true)
  })

  it('has total_roi_max numeric', () => {
    expect(sqlContains('total_roi_max numeric')).toBe(true)
  })
})

// ---------- Leads table columns ----------

describe('leads table columns', () => {
  it('has id uuid primary key with gen_random_uuid()', () => {
    expect(
      sqlMatches(/id\s+uuid\s+primary\s+key\s+default\s+gen_random_uuid\(\)/i),
    ).toBe(true)
  })

  it('has scan_id referencing scans(id)', () => {
    // Second FK reference in the file (first is in reports)
    expect(sqlMatches(/leads[\s\S]*?scan_id\s+text\s+references\s+scans\s*\(\s*id\s*\)/i)).toBe(true)
  })

  it('has email text not null', () => {
    expect(sqlMatches(/email\s+text\s+not\s+null/i)).toBe(true)
  })

  it('has lgpd_consent boolean not null default false', () => {
    expect(
      sqlMatches(/lgpd_consent\s+boolean\s+not\s+null\s+default\s+false/i),
    ).toBe(true)
  })

  it('has lgpd_consent_at timestamptz', () => {
    expect(sqlContains('lgpd_consent_at timestamptz')).toBe(true)
  })
})

// ---------- Indices ----------

describe('Indices', () => {
  const expectedIndices = [
    'idx_scans_sector',
    'idx_scans_status',
    'idx_scans_created_at',
    'idx_reports_scan_id',
    'idx_leads_email_scan',
  ]

  for (const idx of expectedIndices) {
    it(`creates index ${idx}`, () => {
      expect(sqlMatches(new RegExp(`create\\s+index\\s+${idx}`, 'i'))).toBe(true)
    })
  }
})

// ---------- Row Level Security ----------

describe('Row Level Security', () => {
  it('enables RLS on scans', () => {
    expect(
      sqlMatches(/alter\s+table\s+scans\s+enable\s+row\s+level\s+security/i),
    ).toBe(true)
  })

  it('enables RLS on reports', () => {
    expect(
      sqlMatches(/alter\s+table\s+reports\s+enable\s+row\s+level\s+security/i),
    ).toBe(true)
  })

  it('enables RLS on leads', () => {
    expect(
      sqlMatches(/alter\s+table\s+leads\s+enable\s+row\s+level\s+security/i),
    ).toBe(true)
  })
})

// ---------- RLS Policies ----------

describe('RLS Policies', () => {
  it('allows anon to insert scans', () => {
    // Policy should reference role = 'anon' and INSERT on scans
    expect(
      sqlMatches(/create\s+policy[\s\S]*?on\s+scans[\s\S]*?for\s+insert/i),
    ).toBe(true)
    expect(sqlMatches(/anon/i)).toBe(true)
  })

  it('allows anon to read scans by id (SELECT policy)', () => {
    expect(
      sqlMatches(/create\s+policy[\s\S]*?on\s+scans[\s\S]*?for\s+select/i),
    ).toBe(true)
  })

  it('has a lead insert policy that checks lgpd_consent = true', () => {
    // The policy on leads for INSERT must include a check for lgpd_consent
    const leadsInsertPolicy = sql.match(
      /create\s+policy[\s\S]*?on\s+leads[\s\S]*?for\s+insert[\s\S]*?with\s+check\s*\([\s\S]*?\)/i,
    )
    expect(leadsInsertPolicy).not.toBeNull()
    expect(leadsInsertPolicy![0]).toMatch(/lgpd_consent\s*=\s*true/i)
  })
})

// ---------- Trigger: updated_at ----------

describe('updated_at trigger', () => {
  it('creates a function to update updated_at', () => {
    expect(
      sqlMatches(/create\s+(or\s+replace\s+)?function\s+\w*update[_\w]*updated_at/i),
    ).toBe(true)
  })

  it('creates trigger on scans table', () => {
    expect(
      sqlMatches(/create\s+trigger[\s\S]*?on\s+scans/i),
    ).toBe(true)
  })

  it('creates trigger on reports table', () => {
    expect(
      sqlMatches(/create\s+trigger[\s\S]*?on\s+reports/i),
    ).toBe(true)
  })

  it('trigger fires BEFORE UPDATE', () => {
    expect(
      sqlMatches(/before\s+update\s+on/i),
    ).toBe(true)
  })

  it('trigger sets new.updated_at to now()', () => {
    expect(
      sqlMatches(/new\.updated_at\s*[=:]+\s*now\(\)/i),
    ).toBe(true)
  })
})
