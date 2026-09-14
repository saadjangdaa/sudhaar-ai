-- Fills in a placeholder photo for any report that has no media at all, so the
-- feed and complaint-detail page always show a picture instead of the
-- "No photo" empty state. Only touches rows with media_url is null — a report
-- that already has a real photo or a voice note is left untouched.
--
-- The placeholder is a real photo already sitting in the report-media bucket
-- (uploaded during testing), reused as a stand-in image rather than hotlinking
-- something external.
--
-- Safe to re-run: the WHERE clause only ever matches rows still missing media.

update public.reports
set media_url = 'https://kalojauzdwznxlzcjxzt.supabase.co/storage/v1/object/public/report-media/1e4500bd-58e8-447e-b9b0-5eccc6d1aa77.jpg',
    media_type = 'photo'
where media_url is null;

select id, summary, media_url
from public.reports
where media_url = 'https://kalojauzdwznxlzcjxzt.supabase.co/storage/v1/object/public/report-media/1e4500bd-58e8-447e-b9b0-5eccc6d1aa77.jpg';
