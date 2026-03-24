-- =============================================================
-- EI-GAP AI Scanner — Initial Schema Migration
-- E5.S1: Tables, indices, constraints, triggers
-- Compatible with vanilla PostgreSQL (no Supabase dependency)
-- =============================================================

-- ---------- Tables ----------

CREATE TABLE IF NOT EXISTS scans (
  id text PRIMARY KEY,
  sector text NOT NULL,
  company_name text,
  company_size text,
  form_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error jsonb,
  duration_ms integer,
  ip_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id text PRIMARY KEY,
  scan_id text REFERENCES scans(id),
  content jsonb NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  total_roi_min numeric,
  total_roi_max numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id text REFERENCES scans(id),
  email text NOT NULL,
  name text,
  company text,
  lgpd_consent boolean NOT NULL DEFAULT false,
  lgpd_consent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  -- LGPD: enforce consent at DB level (replaces Supabase RLS policy)
  CONSTRAINT chk_lgpd_consent CHECK (lgpd_consent = true)
);

-- ---------- Indices ----------

CREATE INDEX IF NOT EXISTS idx_scans_sector ON scans(sector);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_scan_id ON reports(scan_id);
CREATE INDEX IF NOT EXISTS idx_leads_email_scan ON leads(email, scan_id);

-- ---------- updated_at trigger ----------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scans_updated_at
  BEFORE UPDATE ON scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
