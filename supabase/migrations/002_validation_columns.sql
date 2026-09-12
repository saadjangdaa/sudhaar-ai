-- Columns written by the validator agent (api/app/graph/validator.py), plus the
-- reconciled status constraint.
--
-- Safe to re-run. Paste into the Supabase SQL editor. If you are applying
-- supabase/schema.sql fresh you do not need this file — schema.sql already
-- contains everything here.

alter table public.reports
  add column if not exists status text not null default 'pending',
  add column if not exists ai_overview text,
  add column if not exists validity_confidence numeric,
  add column if not exists rejection_reason text,
  add column if not exists evidence_quality text;

-- The admin desk shipped a three-value constraint ('pending','in_progress','fixed').
-- The validator needs a fourth, 'rejected'. Dropping first is the point: if the old
-- constraint survives, every rejected report fails to insert and the submit endpoint
-- 500s on exactly the fake complaints this agent exists to catch.
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports
  add constraint reports_status_check
  check (status in ('pending', 'in_progress', 'fixed', 'rejected'));

-- The public feed always filters on status, so status leads the index it uses.
create index if not exists reports_status_upvotes_idx
  on public.reports (status, upvotes desc, created_at desc);

-- Anything inserted before the validator existed was never reviewed. Leave it
-- visible — it is real demo data — but say so rather than implying the AI passed it.
update public.reports
set ai_overview = 'Submitted before automated review was enabled; not AI-reviewed.'
where ai_overview is null;
