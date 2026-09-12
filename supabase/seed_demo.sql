-- Demo data. Run AFTER schema.sql and seed_authorities.sql.
--
-- WHY THIS RUNS AT STAGE 0, not at the end: the citizen feed needs rows to sort
-- by upvotes, and the /admin authority desk needs real notification rows to
-- render. Seeding early means two developers build against real data instead of
-- mocking it.
--
-- Re-running is safe: it deletes only rows tagged with the '[demo]' marker.

delete from public.reports where raw_text like '[demo]%';

with seeded as (
  insert into public.reports
    (raw_text, issue_type, summary, area_tag, authority_slug, authority_assigned, upvotes, language, complaint_text, media_type)
  values
    ('[demo] Huge pothole outside the main gate, cars are swerving into oncoming traffic',
     'pothole', 'Deep pothole on a main road causing dangerous swerving', 'gulshan_e_iqbal', 'kmc',
     'Karachi Metropolitan Corporation', 42, 'en', 'Subject: Urgent repair of road surface, Gulshan-e-Iqbal ...', 'photo'),
    ('[demo] Sewage has been overflowing onto the street for three days, children walk through it',
     'sewage', 'Sustained sewage overflow onto a residential street', 'lyari', 'kwsb',
     'Karachi Water & Sewerage Board', 37, 'en', 'Subject: Immediate attention required - sewage overflow, Lyari ...', 'photo'),
    ('[demo] Garbage has not been collected from the corner plot in two weeks',
     'garbage', 'Uncollected refuse accumulating on a corner plot', 'north_nazimabad', 'sswmb',
     'Sindh Solid Waste Management Board', 29, 'en', 'Subject: Request for refuse collection, North Nazimabad ...', null),
    ('[demo] No water supply in the entire lane since Monday, tankers are charging triple',
     'water', 'Complete water supply failure affecting a full lane', 'korangi', 'kwsb',
     'Karachi Water & Sewerage Board', 24, 'en', 'Subject: Restoration of water supply, Korangi ...', null),
    ('[demo] Footpath completely encroached by stalls, pedestrians forced onto the road',
     'encroachment', 'Footpath blocked by unauthorised stalls', 'saddar', 'tma',
     'Town Municipal Administration', 18, 'en', 'Subject: Removal of encroachment, Saddar ...', 'photo'),
    ('[demo] Broken storm drain cover near the park, someone is going to fall in',
     'sewage', 'Missing storm drain cover creating a fall hazard', 'clifton', 'cbc',
     'Cantonment Board Clifton', 11, 'en', 'Subject: Replacement of storm drain cover, Clifton ...', 'photo'),
    ('[demo] سڑک پر گندے پانی کا جمع ہونا، بچوں کا اسکول جانا مشکل ہے',
     'sewage', 'Standing wastewater blocking the route to a school', 'malir', 'malir_cb',
     'Malir Cantonment Board', 7, 'ur', 'بخدمت جناب ... ملیر کینٹونمنٹ بورڈ', null),
    ('[demo] Rubbish being burned in the open every evening, the smoke is unbearable',
     'garbage', 'Open burning of refuse causing heavy smoke', 'landhi', 'sswmb',
     'Sindh Solid Waste Management Board', 3, 'en', 'Subject: Open burning of refuse, Landhi ...', null)
  returning id, issue_type, area_tag, authority_slug
)
-- one notification per seeded report, so the admin portal has data on day one
insert into public.notifications (authority_id, report_id, message)
select a.id,
       s.id,
       'New ' || s.issue_type || ' complaint reported in ' || coalesce(s.area_tag, 'an unspecified area')
  from seeded s
  join public.authorities a on a.slug = s.authority_slug;
