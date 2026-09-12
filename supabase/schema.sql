-- CWA Ship Karachi 2026 — Track 1: civic issue reporting & routing
-- Run this ONCE in the Supabase SQL editor, then seed_authorities.sql, then seed_demo.sql.
-- Safe to re-run: drops are ordered by dependency.

-- ---------------------------------------------------------------------------
-- tables
-- ---------------------------------------------------------------------------

create table if not exists public.reports (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  media_url           text,
  raw_text            text,
  issue_type          text,
  authority_assigned  text,
  complaint_text      text,
  area_tag            text,
  upvotes             int  not null default 0,
  -- extras the pipeline fills in
  summary             text,
  language            text default 'en',
  media_type          text,          -- 'photo' | 'audio' | null
  transcript          text,
  email_status        text,          -- null | 'sent' | 'failed' | 'skipped'
  authority_slug      text           -- stable key into public.authorities
);

create index if not exists reports_upvotes_idx   on public.reports (upvotes desc, created_at desc);
create index if not exists reports_area_idx      on public.reports (area_tag);
create index if not exists reports_authority_idx on public.reports (authority_assigned);

-- One status column serves two workflows, so all four values live in one place:
--
--   rejected     the validator agent judged the complaint fake. Hidden from the
--                public feed and from the authority desk. Terminal.
--   pending      passed automated review, published, not yet picked up
--   in_progress  an authority has taken it on            (admin desk)
--   fixed        an authority proved the repair           (admin desk, verify-fix)
--
-- Adding a value here means adding it to api/app/schemas.py, web/src/lib/types.ts
-- and web/src/lib/admin/types.ts as well.
alter table public.reports
  add column if not exists status text not null default 'pending';

-- Dropped and recreated rather than created-if-absent: an older database may
-- already carry a three-value version of this constraint, and leaving it in place
-- would make every 'rejected' insert fail.
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports
  add constraint reports_status_check
  check (status in ('pending', 'in_progress', 'fixed', 'rejected'));

create index if not exists reports_status_idx on public.reports (status, created_at desc);

create table if not exists public.votes (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  session_id  text not null,
  created_at  timestamptz not null default now(),
  unique (report_id, session_id)
);

-- authority contacts. A table (not a Python dict) because notifications needs a
-- FK target and auth_user_id needs to reference auth.users.
create table if not exists public.authorities (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,   -- 'kmc', 'kwsb', 'sswmb', 'tma', 'cbc', ...
  name          text not null,
  acronym       text,
  email         text,
  phone         text,
  -- Links an authority to a Supabase auth account. Set by /admin approvals.
  -- Supabase auth account. Nothing reads or writes this yet.
  auth_user_id  uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  authority_id  uuid not null references public.authorities(id) on delete cascade,
  report_id     uuid not null references public.reports(id) on delete cascade,
  message       text not null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_unread_idx
  on public.notifications (authority_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- atomic upvote: one vote per (report, session), no read-modify-write race
-- ---------------------------------------------------------------------------

create or replace function public.upvote_report(p_report_id uuid, p_session_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.votes (report_id, session_id)
  values (p_report_id, p_session_id)
  on conflict (report_id, session_id) do nothing;

  if not found then
    -- this session already voted; return the current count unchanged
    select upvotes into v_count from public.reports where id = p_report_id;
    return coalesce(v_count, 0);
  end if;

  update public.reports
     set upvotes = upvotes + 1
   where id = p_report_id
  returning upvotes into v_count;

  return coalesce(v_count, 0);
end;
$$;

grant execute on function public.upvote_report(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.reports       enable row level security;
alter table public.votes         enable row level security;
alter table public.authorities   enable row level security;
alter table public.notifications enable row level security;

-- reports: world-readable (the public feed), never writable from the browser.
-- FastAPI inserts with the service-role key, which bypasses RLS entirely.
drop policy if exists "reports are publicly readable" on public.reports;
create policy "reports are publicly readable"
  on public.reports for select
  using (true);

-- votes: NO policy on purpose. Unreachable from the browser; the only way in is
-- the security-definer upvote_report() function above.

-- authorities + notifications: RLS enabled with ZERO policies = deny-all to the
-- anon key. Reachable only by the service role (server-side).
-- Per-authority read policies are deliberately left to the authority desk work;
-- see web/src/lib/admin/.

-- ---------------------------------------------------------------------------
-- storage: public bucket for report photos / voice notes
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('report-media', 'report-media', true)
on conflict (id) do nothing;

drop policy if exists "anyone can upload report media" on storage.objects;
create policy "anyone can upload report media"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'report-media');

drop policy if exists "report media is publicly readable" on storage.objects;
create policy "report media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'report-media');

