-- Run this ONCE in Supabase → SQL Editor if report submit fails with
-- "Could not find the 'accuracy_m' column" (or similar missing-column errors).
-- Safe to re-run (uses IF NOT EXISTS throughout).

-- From 002_validation_columns.sql
alter table public.reports
  add column if not exists status text not null default 'pending',
  add column if not exists ai_overview text,
  add column if not exists validity_confidence numeric,
  add column if not exists rejection_reason text,
  add column if not exists evidence_quality text;

alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports
  add constraint reports_status_check
  check (status in ('pending', 'in_progress', 'fixed', 'rejected'));

-- From 003_repair_orphan_routing.sql
alter table public.reports
  add column if not exists routing_reason text;

-- From 005_report_location.sql
alter table public.reports
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists accuracy_m double precision;

-- Backend verifier columns (optional)
alter table public.reports
  add column if not exists after_image_url text,
  add column if not exists verification_status text default 'unverified',
  add column if not exists verification_confidence numeric,
  add column if not exists verification_reason text,
  add column if not exists tamper_flag boolean default false,
  add column if not exists verified_at timestamptz;
