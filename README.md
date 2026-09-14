# Sudhaar AI

Civic issue reporting and routing for Karachi. **CWA Ship Karachi 2026, Track 1.**

A citizen reports a pothole, nala overflow, uncollected kachra, or similar with a
photo, a voice note, or a few words. A LangGraph pipeline classifies the issue,
routes it to the authority that actually owns that area and issue type, and drafts
a formal complaint in English or Urdu. Authority staff then pick the complaint up
on a scoped desk: start work, prove a repair with a photo, optionally generate an
AI redesign of the street.

```
Citizen browser  (Next.js)
  1. Upload photo / voice note → Supabase Storage bucket `report-media` (anon key)
  2. POST /api/report { media_url, media_type, raw_text, area_input, language }
        │
        ▼
FastAPI  (api/ or backend/, port 8000)
  ingest → classifier → router → validator → drafter     [LangGraph + Gemini]
  INSERT public.reports  (service-role key)
        │
        ▼
  Result card  →  public feed /c/[id]  →  authority desk /admin
```

The public feed, upvotes, comments, and most dashboard reads go **straight to
Supabase** from Next.js server components. The FastAPI process is only required
for classification, routing, drafting, email, and AI verify / redesign.

**Rule: never push a commit that does not build.** A broken `main` blocks every
deploy.

---

## Repository layout

| Path | What it is |
|---|---|
| `web/` | Next.js 16 App Router UI (citizen + authority desk) |
| `api/` | Original FastAPI pipeline the citizen form was built against. Frozen HTTP contract in `app/schemas.py`. |
| `backend/` | Second FastAPI service (LangGraph agents, `/agent/*`, plus a legacy `/api/report` adapter) |
| `supabase/` | Schema, seeds, and additive SQL migrations |
| `docs/CONTRACTS.md` | Human copy of the `POST /api/report` contract |

Only one process can bind **port 8000**. Point `NEXT_PUBLIC_API_BASE_URL` at whichever
API you are running. The citizen form calls `POST /api/report` on that origin.

---

## What the product does

### Citizen (`web/`)

| Route | Purpose |
|---|---|
| `/` | Submit a report (photo, audio, or text + area + language) |
| `/submit` | Alternate submit entry |
| `/feed` | Public, upvote-sorted feed |
| `/c/[id]` | Single complaint: letter, AI overview, comments, send-email |
| `/dashboard` | Filterable public board (area / authority / issue) |
| `/login` | Citizen login (Supabase Auth) |

Upvotes go through the security-definer RPC `upvote_report(report_id, session_id)`
so one browser session cannot inflate a count. Comments live in `public.comments`.

### Authority desk (`/admin`)

Metadata-backed RBAC (no `authority_admins` table yet). Signup writes
`user_metadata: { authorityId: null, approvalStatus: 'pending' }`. A super-admin
assigns a row from `public.authorities` and flips `approvalStatus` to `approved`.
`src/proxy.ts` (Next.js 16 name for middleware) gates `/admin/*`.

| Route | Who |
|---|---|
| `/admin/login` | Anyone |
| `/admin/pending-approval` | Signed-in, not yet approved |
| `/admin/dashboard` | Approved admin — reports for **their** `authority_slug` only |
| `/admin/super/approvals` | Emails in `SUPER_ADMIN_EMAILS` |

Desk workflow:

1. **Pending** → Start work → `in_progress`
2. **Mark fixed** → upload proof photo → `POST /api/admin/verify-fix` → status
   becomes `fixed` only when verification returns `verified: true`
3. **AI Re-design** → `POST /api/admin/redesign` (needs `GEMINI_API_KEY` on the
   Next server). Drafts a written repair recommendation; there is no generated
   "after" image, because image generation has no free-tier quota on this key.

Reports with `status = rejected` (validator judged the submission fake) are
hidden from the public feed **and** from the desk.

When `SUPABASE_SERVICE_ROLE_KEY` is set, the desk reads live `public.reports`
via `SupabaseReportsRepository`. Without it, a mock repository is used so the UI
still renders.

---

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4
- **Auth / data:** Supabase (Postgres, Auth, Storage, RLS)
- **AI:** Google Gemini (`gemini-3.5-flash-lite` — one model for text, vision and
  voice-note transcription). The free tier meters requests per day **per model**,
  so switching `GEMINI_MODEL` resets your budget; `gemini-3.6-flash` allows only 20/day.
- **Agents:** LangGraph (classifier → router → validator → drafter; separate verify graph)

---

## Setup

One shared Supabase project. Do not commit `.env` files.

### 1. Database

In the Supabase SQL editor, **new project**, run in order:

```
supabase/schema.sql
supabase/seed_authorities.sql
supabase/seed_demo.sql
```

Existing project that was created from an older schema — also run any missing
files under `supabase/migrations/`, or the catch-up script:

```
supabase/migrations/006_catchup_run_in_sql_editor.sql
```

| Migration | Adds |
|---|---|
| `002_validation_columns.sql` | `status`, `ai_overview`, `validity_confidence`, `rejection_reason`, `evidence_quality` |
| `003_repair_orphan_routing.sql` | `routing_reason`; backfill of unrouted rows |
| `004_comments.sql` | `public.comments` |
| `005_report_location.sql` | `latitude`, `longitude`, `accuracy_m` |
| `006_catchup_run_in_sql_editor.sql` | Safe `IF NOT EXISTS` bundle of the above |

Seeded authority emails are **placeholders**. Never mail real departments from a
hackathon build.

### 2. Citizen / contract API (`api/`)

```bash
cd api
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env          # then fill it in
python -m uvicorn main:app --reload --port 8000
```

`MOCK_AGENTS=true` (default) runs with **no Gemini key** — every agent returns
canned output in the contract shape. Set `MOCK_AGENTS=false` once prompts and
keys are real.

```bash
curl -s localhost:8000/health
```

### 3. Agent API (`backend/`) — optional second process

Same port 8000, so stop `api/` first if you switch.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
# copy .env.example to .env and fill keys
python -m uvicorn main:app --reload --port 8000
```

On Windows, `uvicorn` is not on PATH unless the venv is activated. Prefer
`python -m uvicorn ...`.

| Method | Path | Role |
|---|---|---|
| GET | `/health` | liveness |
| POST | `/api/report` | legacy citizen contract |
| POST | `/api/report/{id}/email` | email stub/adapter |
| POST | `/agent/process` | agent graph, richer response |
| POST | `/agent/verify-fix` | before/after repair verification |
| GET | `/agent/health` | agent router health |

### 4. Frontend (`web/`)

```bash
cd web
npm install
```

Create `web/.env.local` (this folder gitignores all `.env*` files):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=
SUPER_ADMIN_EMAILS=you@example.com
AI_VERIFY_ENABLED=false
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
```

```bash
npm run dev      # http://localhost:3000
npm run build    # must pass before you push
```

`NEXT_PUBLIC_*` values are **inlined at build time**. A deployed site with no
`NEXT_PUBLIC_API_BASE_URL` will fail loudly rather than posting to the visitor's
laptop.

---

## Environment variables

### `api/.env`

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Required when `MOCK_AGENTS=false`. Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | Default `gemini-3.5-flash-lite`. Same model does text, vision and voice notes |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Bypasses RLS. **Never** `NEXT_PUBLIC_` |
| `MOCK_AGENTS` | `true` = canned agents, zero API spend |
| `ALLOWED_ORIGINS` | CORS, comma-separated |
| `WEB_BASE_URL` | Link back to the complaint in email |
| `ENABLE_EMAIL` | Default `false` |
| `EMAIL_OVERRIDE_TO` | **Keep set.** All mail goes here instead of seeded department addresses |

### `backend/.env`

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Required for live agents |
| `GEMINI_MODEL` | Default `gemini-3.5-flash-lite` |
| `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only |
| `CORS_ORIGINS` | Default `*` |
| `LOG_LEVEL` | Default `INFO` |

### `web/.env.local`

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Safe to ship; RLS is the guard |
| `NEXT_PUBLIC_API_BASE_URL` | FastAPI origin. Required in production |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin desk + Auth admin API only. Server files only |
| `SUPER_ADMIN_EMAILS` | Comma-separated allowlist for `/admin/super/approvals` |
| `AI_VERIFY_ENABLED` | `true` = call vision verify; off = auto-pass so the desk can be tested |
| `GEMINI_API_KEY` | AI Re-design on the desk |
| `GEMINI_MODEL` | Default `gemini-3.5-flash-lite` |

---

## Data model (high level)

`public.reports` is world-readable (the feed). The browser cannot insert or
update it; FastAPI and the admin desk write with the service role.

| `reports.status` | Meaning |
|---|---|
| `rejected` | Validator failed the submission. Hidden everywhere |
| `pending` | Published, waiting on an authority |
| `in_progress` | Desk accepted it |
| `fixed` | Desk proved the repair (`verify-fix` returned verified) |

Other tables: `votes` (RPC only from the browser), `authorities` (deny-all RLS),
`notifications` (deny-all RLS), `comments`.

Reports are scoped to a desk by **`authority_slug`**, matching `authorities.slug`
(`kmc`, `kwsb`, `sswmb`, `tma`, `cbc`, `malir_cb`, `faisal_cb`). Cantonment areas
(Clifton, DHA, Malir, Faisal Cantt) go to the cantonment board for every issue
type; municipal areas use the issue-type table in `api/app/authorities.py`.

Authority login until `authority_admins` exists:

- `auth.users.user_metadata.authorityId` / `approvalStatus`
- `authorities.auth_user_id` is set on approve (1:1 hook on the authority row)

---

## HTTP contract

Source of truth: `api/app/schemas.py`. Mirror: `web/src/lib/types.ts`. Write-up:
`docs/CONTRACTS.md`.

Rename a field in one place and the UI renders `undefined` with no exception.
Change all three files in the same commit and say so.

`POST /api/report` — at least one of `raw_text` / `media_url`. `media_type` is
`photo | audio | null`. `language` is `en | ur`.

`POST /api/report/{id}/email` — `email_status` is `sent | failed | skipped`.
**`skipped` is not an error**; it is what you get when `ENABLE_EMAIL=false`.

---

## Deploy notes

- **Vercel** hosts `web/`. Set every `NEXT_PUBLIC_*` var **before** the production
  build. Redeploy after changing them.
- **Render** (or similar) hosts FastAPI. Free tier sleeps after ~15 minutes idle
  and takes ~50s to wake. The citizen app calls `warmBackend()` on load.
- `SUPABASE_SERVICE_ROLE_KEY` must never be imported from a `"use client"` file
  and must never be renamed to `NEXT_PUBLIC_*`. Either mistake publishes full
  database access in the browser bundle.
- Keep `EMAIL_OVERRIDE_TO` set. The seed inboxes are fake.

---

## Who owns what

Directories are split so people can land on `main` without colliding. Announce
before you edit a shared file.

| Who | Owns |
|---|---|
| Saad | Citizen `web/` (feed, submit, `/c/[id]`, public dashboard) |
| Authority-desk owner | `web/src/app/admin/`, `web/src/lib/admin/`, `web/src/app/api/admin/`, `web/src/proxy.ts` |
| API owner | `api/` |
| Agent owner | `backend/` |
| Shared | `supabase/`, `docs/CONTRACTS.md`, `web/src/lib/types.ts` |

---

## Common failures

| Symptom | Likely cause |
|---|---|
| `uvicorn` is not recognized | Venv not activated. Use `python -m uvicorn ...` |
| `Failed to fetch` on submit (production) | Missing `NEXT_PUBLIC_API_BASE_URL` at **build** time |
| Report insert: missing column `accuracy_m` / `status` / … | Run `006_catchup_run_in_sql_editor.sql` |
| Admin desk empty after approve | `user_metadata.authorityId` is not a live `authorities.id` (re-assign from Approvals) |
| Mark-fixed modal invisible | Hard refresh; production CSS for the dialog lives in `admin.css` |
| Super-admin page redirects away | `SUPER_ADMIN_EMAILS` not loaded — restart `next dev` after editing `.env.local` |
| Anon client returns zero authorities | RLS deny-all. Desk must use the service-role server client |
