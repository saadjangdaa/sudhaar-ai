-- An optional GPS pin on a report.
--
-- area_tag answers "which desk owns this" and is enough to route. It is not
-- enough to find the thing: "Gulshan-e-Iqbal" is roughly 800,000 people, and a
-- crew sent to fix "a pothole in Gulshan" fixes nothing. These columns carry the
-- pin the citizen chose to attach, so the letter and the authority desk can point
-- at one spot on a map.
--
-- accuracy_m is stored because it is what separates a usable pin from a useless
-- one. A phone with GPS lock reports 5-20 m; the same phone indoors on wifi
-- reports 2000 m and is lying with total confidence. Without this column the desk
-- cannot tell those apart, and a crew sent to a 2 km pin is worse off than one
-- sent to just the area name.
--
-- ---------------------------------------------------------------------------
-- These coordinates are PUBLIC. public.reports is selectable by anyone holding
-- the anon key — that is what makes the feed work — so a pin here is visible to
-- everyone, and most people report from outside their own gate. That is why the
-- capture is opt-in behind a button, why the UI says so in as many words before
-- submit, and why the pin can be removed without losing the complaint.
--
-- If this ever needs to be authority-only, it cannot be done by rounding the
-- value at render time: the raw column is already in the browser's payload. It
-- needs its own table with RLS scoped to the owning authority, in the same shape
-- as the CNIC note at the top of web/src/lib/auth.ts.
-- ---------------------------------------------------------------------------
--
-- Safe to re-run.

alter table public.reports
  add column if not exists latitude   double precision,
  add column if not exists longitude  double precision,
  add column if not exists accuracy_m double precision;

-- Range checks only, deliberately not a Karachi bounding box: a teammate testing
-- from Lahore or a judge opening the demo from anywhere else would otherwise have
-- their submission rejected by the database with no explanation.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reports_latitude_range'
  ) then
    alter table public.reports
      add constraint reports_latitude_range
      check (latitude is null or latitude between -90 and 90);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'reports_longitude_range'
  ) then
    alter table public.reports
      add constraint reports_longitude_range
      check (longitude is null or longitude between -180 and 180);
  end if;

  -- One coordinate alone is not a location. Half a pin would render as a map
  -- link pointing at the equator.
  if not exists (
    select 1 from pg_constraint where conname = 'reports_latlng_together'
  ) then
    alter table public.reports
      add constraint reports_latlng_together
      check ((latitude is null) = (longitude is null));
  end if;
end $$;

-- Lets the authority desk pull "everything pinned" without a full scan once
-- there are enough rows for that to matter.
create index if not exists reports_located_idx
  on public.reports (latitude, longitude)
  where latitude is not null;

select count(*) as reports_with_a_pin
  from public.reports
 where latitude is not null;
