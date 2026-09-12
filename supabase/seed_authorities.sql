-- Karachi civic authorities. Run AFTER schema.sql.
-- NOTE: these email addresses are PLACEHOLDERS invented for the demo. Do not
-- remove EMAIL_OVERRIDE_TO in the API without replacing them with real, verified
-- addresses — and even then, don't mail real departments from a hackathon build.

insert into public.authorities (slug, name, acronym, email, phone) values
  ('kmc',       'Karachi Metropolitan Corporation',          'KMC',   'complaints@kmc.example.gov.pk',      '+92-21-99211111'),
  ('kwsb',      'Karachi Water & Sewerage Board',            'KWSB',  'complaints@kwsb.example.gov.pk',     '+92-21-99230000'),
  ('sswmb',     'Sindh Solid Waste Management Board',        'SSWMB', 'complaints@sswmb.example.gov.pk',    '+92-21-99333333'),
  ('tma',       'Town Municipal Administration',             'TMA',   'complaints@tma.example.gov.pk',      '+92-21-99244444'),
  ('cbc',       'Cantonment Board Clifton',                  'CBC',   'complaints@cbc.example.gov.pk',      '+92-21-99255555'),
  ('malir_cb',  'Malir Cantonment Board',                    'MCB',   'complaints@malircb.example.gov.pk',  '+92-21-99266666'),
  ('faisal_cb', 'Faisal Cantonment Board',                   'FCB',   'complaints@faisalcb.example.gov.pk', '+92-21-99277777')
on conflict (slug) do update
  set name = excluded.name,
      acronym = excluded.acronym,
      email = excluded.email,
      phone = excluded.phone;
