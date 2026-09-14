-- A handful of live rows have a real media_url but media_type left null —
-- rows inserted by hand while testing, or written before this column existed.
-- The feed and complaint-detail page used to trust media_type alone to decide
-- whether to render an <img>, so these rows showed the "No photo" placeholder
-- even though a real photo was sitting at the URL. The frontend now falls back
-- to sniffing the URL (see isPhotoUrl in web/src/lib/format.ts), but the data
-- itself is still wrong, so fix it at the source: anything that isn't an
-- audio file extension is a photo, matching the same heuristic.

update public.reports
set media_type = 'photo'
where media_url is not null
  and media_type is null
  and media_url !~* '\.(mp3|m4a|wav|ogg|webm)(\?|$)';

-- Anything left with a null media_type and a real media_url is an audio file
-- whose extension didn't match above, or something stranger — leave it alone
-- rather than guess wrong.

select id, media_url, media_type
from public.reports
where media_url is not null and media_type is null;
