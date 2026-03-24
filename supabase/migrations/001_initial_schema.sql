-- =============================================================
-- EI-GAP AI Scanner — Initial Schema Migration
-- E5.S1: Tables, indices, RLS, policies, triggers
-- =============================================================

-- ---------- Tables ----------

create table scans (
  id text primary key,
  sector text not null,
  company_name text,
  company_size text,
  form_data jsonb not null,
  status text not null default 'pending',
  error jsonb,
  duration_ms integer,
  ip_hash text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table reports (
  id text primary key,
  scan_id text references scans(id),
  content jsonb not null,
  status text not null default 'processing',
  total_roi_min numeric,
  total_roi_max numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  scan_id text references scans(id),
  email text not null,
  name text,
  company text,
  lgpd_consent boolean not null default false,
  lgpd_consent_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- Indices ----------

create index idx_scans_sector on scans(sector);
create index idx_scans_status on scans(status);
create index idx_scans_created_at on scans(created_at);
create index idx_reports_scan_id on reports(scan_id);
create index idx_leads_email_scan on leads(email, scan_id);

-- ---------- Row Level Security ----------

alter table scans enable row level security;
alter table reports enable row level security;
alter table leads enable row level security;

-- ---------- RLS Policies ----------

-- Anon can insert scans (public form submission)
create policy "anon_insert_scans"
  on scans
  for insert
  to anon
  with check (true);

-- Anon can read a scan by its id (to check status / retrieve result)
create policy "anon_select_scans_by_id"
  on scans
  for select
  to anon
  using (true);

-- Anon can read reports linked to a scan they know the id of
create policy "anon_select_reports"
  on reports
  for select
  to anon
  using (true);

-- Anon can insert a lead ONLY if lgpd_consent = true
create policy "anon_insert_leads_with_consent"
  on leads
  for insert
  to anon
  with check (lgpd_consent = true);

-- Anon can read their own lead by scan_id
create policy "anon_select_leads"
  on leads
  for select
  to anon
  using (true);

-- ---------- updated_at trigger ----------

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_scans_updated_at
  before update on scans
  for each row
  execute function update_updated_at();

create trigger trg_reports_updated_at
  before update on reports
  for each row
  execute function update_updated_at();
