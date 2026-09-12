-- Adds reports.routing_reason, then repairs reports that no desk can ever see.
--
-- Safe to re-run: the column add is guarded and every update is scoped to rows
-- that are still broken.

-- ---------------------------------------------------------------------------
-- routing_reason was never persisted.
--
-- router.py computes it, main.py returns it in ReportResponse, and
-- web/src/lib/types.ts declares it — but it was missing from the insert and from
-- the table, so the one sentence explaining why a complaint landed on a given
-- desk was shown to the citizen once at submit time and then discarded. The
-- authority opening that report later has no idea why it is theirs.
-- ---------------------------------------------------------------------------
alter table public.reports
  add column if not exists routing_reason text;

-- ---------------------------------------------------------------------------
-- Rows that belong to no desk.
--
-- The admin desk selects with `.eq("authority_slug", <desk slug>)`. A row whose
-- authority_slug is NULL, or is a slug with no matching public.authorities row,
-- therefore belongs to nobody and is invisible to every authority forever — the
-- citizen is told their complaint was filed, and no authority is ever shown it.
--
-- Two causes, both present in the live table:
--   * NULL slug         — written before the router set authority_slug.
--   * 'dha_maintenance' — a department that does not exist. api/app/graph/router.py
--     resolves the authority by deterministic table lookup and cannot emit this,
--     so these rows predate that design. DHA is cantonment jurisdiction, and
--     api/app/authorities.py maps dha -> cbc, which is where they should have gone.
--
-- area_tag is normalized in the same pass: it holds raw free text ("DHA",
-- "Gulshan-e-Iqbal, Karachi") on these rows, so AREA_LABELS lookups and the
-- dashboard area filter both miss them.
-- ---------------------------------------------------------------------------

-- Garbage in Gulshan-e-Iqbal -> Sindh Solid Waste Management Board.
update public.reports
set authority_slug     = 'sswmb',
    authority_assigned = 'Sindh Solid Waste Management Board',
    area_tag           = 'gulshan_e_iqbal',
    routing_reason     = 'Garbage complaints in Gulshan-e-Iqbal are handled by Sindh Solid Waste Management Board.'
where authority_slug is null
  and issue_type = 'garbage'
  and area_tag ilike '%gulshan%';

-- DHA is cantonment limits; the board handles all municipal services there.
update public.reports
set authority_slug     = 'cbc',
    authority_assigned = 'Cantonment Board Clifton',
    area_tag           = 'dha',
    routing_reason     = 'DHA falls under cantonment administration, which handles all municipal services within its limits.'
where authority_slug = 'dha_maintenance';

-- Anything still unrouted goes to KMC, the default in api/app/authorities.py.
-- Better a desk that can reassign it than a row nobody will ever open.
update public.reports
set authority_slug     = 'kmc',
    authority_assigned = 'Karachi Metropolitan Corporation',
    routing_reason     = coalesce(routing_reason, 'Area could not be resolved; routed to KMC as the default municipal authority.')
where authority_slug is null
   or authority_slug not in (select slug from public.authorities);

-- Should return zero rows.
select id, authority_slug, area_tag, issue_type
from public.reports
where authority_slug is null
   or authority_slug not in (select slug from public.authorities);
