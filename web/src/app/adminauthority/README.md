# /adminauthority — authority portal

**Owner: [teammate]. Nobody else commits here.**

Everything in this folder plus `web/src/lib/adminauthority/` is yours. The citizen
flow never imports from either, so you cannot break the demo, and the demo cannot
break you.

## What already exists

| Piece | Where |
|---|---|
| `authorities` table, with `auth_user_id` for login | `supabase/schema.sql` |
| `notifications` table + seeded rows | `supabase/schema.sql`, `supabase/seed_demo.sql` |
| `getNotificationsForAuthority(authorityId)` | `web/src/lib/adminauthority/queries.ts` |
| `getAllNotifications()`, `getAuthorities()` | same file |
| Service-role Supabase client | `web/src/lib/supabase/admin.ts` |
| Placeholder pages | `login/page.tsx`, `dashboard/page.tsx` |

Seed data is already in the database, so you can build the table against real rows
straight away. No mocking needed.

## Two things to know before you start

**1. The anon key cannot read `notifications`.**
`notifications` and `authorities` have RLS enabled with **no policies**, which means
deny-all to the browser. That is why the queries go through
`createAdminClient()` (service-role) instead of the normal client. If you write a
`"use client"` component that reads notifications directly, you will get zero rows
and no error.

**Never import `admin.ts` into a `"use client"` file, and never rename
`SUPABASE_SERVICE_ROLE_KEY` to `NEXT_PUBLIC_*`.** Either one publishes full
read/write access to the entire database inside the browser bundle. Keep those
reads in server components.

**2. There is no session yet, so the dashboard currently shows everyone.**
Without login there is no way to know which authority is looking, so
`getAllNotifications()` returns rows for every authority. That is expected at this
stage — and it is exactly what `authorities.auth_user_id` is reserved for. It also
means this portal is **not shippable beyond the hackathon** until the auth work is
done.

## Suggested order

1. **Table first, no auth.** Render `getAllNotifications()` in
   `dashboard/page.tsx` with a join to `reports` for the issue type and area. You
   get a working screen in minutes.
2. **Then login.** Supabase Auth email sign-in on `login/page.tsx`. Set
   `authorities.auth_user_id` for a test authority by hand in the SQL editor.
3. **Then scope it.** Look up the authority row by `auth_user_id`, swap
   `getAllNotifications()` for `getNotificationsForAuthority(authority.id)`.
4. **Then mark-as-read.** `is_read` already exists; a server action updating it is
   enough.
5. **Only if there is time:** proper RLS policies keyed on `auth_user_id`, so the
   service-role client can be dropped entirely. That is the correct end state.

Do not add links from the citizen pages to this area, and do not touch
`web/src/app/page.tsx`, `feed/`, or `dashboard/` — those belong to someone else.
