# Sudhaar AI

Civic issue reporting and routing for Karachi. **CWA Ship Karachi 2026, Track 1.**

A citizen reports a problem with a photo, a voice note, or a few words. A 3-agent
LangGraph pipeline classifies it, routes it to the authority that actually owns it,
and drafts a formal complaint letter in English or Urdu.

```
Browser (Next.js / Vercel)
  1. upload photo or voice note -> Supabase Storage (anon key, direct)
  2. POST /api/report { media_url, media_type, raw_text, area_input, language }
        |
        v
FastAPI (Render)
  ingest (transcribe) -> classifier -> router -> drafter      [LangGraph, OpenAI]
  insert into public.reports (service-role key)
        |
        v
  full report row -> result card (copy / send)
```

Feed and dashboard read Supabase directly from server components. Upvotes go
through a security-definer RPC.

## Who owns what

Directories are disjoint on purpose, so we all commit to `main` without conflicts.

| Who | Owns | Working on |
|---|---|---|
| Saad | `web/` except `admin` | Report form, feed, dashboard |
| Dev A | all of `api/` | Real prompts, then Gmail SMTP — see `api/README.md` |
| Dev B | `web/src/app/admin/`, `web/src/lib/admin/` | Authority desk |
| shared | `supabase/`, `docs/CONTRACTS.md`, `web/src/lib/types.ts` | **announce before editing** |

**The one rule: never push a commit that does not build.** A broken `main` blocks
everyone else deploying.

## Setup

One shared Supabase project. Keys are pinned in the group chat.

**1. Database** — in the Supabase SQL editor, run in this order:

```
supabase/schema.sql             tables, RLS, storage bucket, upvote RPC
supabase/seed_authorities.sql   7 authorities
supabase/seed_demo.sql          8 reports + notification rows
```

Seed data is loaded up front on purpose: the feed needs rows to sort and the admin
portal needs notifications to render, so nobody has to mock anything.

**2. Backend**

```bash
cd api
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Runs with **no OpenAI key** — `MOCK_AGENTS=true` returns canned output in the
correct shape.

**3. Frontend**

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

## What is deliberately not built

Per-authority RBAC in the citizen flow, AI-generated "fixed road" images, 3D
models, and comments on reports. Authority login lives only in `/admin`
and is that persons scope.

## Watch out for

- **Render free tier sleeps** after ~15 min idle, then takes ~50s to wake. Call
  `warmBackend()` on page load and warm it before demoing.
- **`SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix** and must never be
  imported into a `"use client"` file. It grants full database access.
- **The seeded authority emails are invented placeholders.** `EMAIL_OVERRIDE_TO`
  keeps all mail going to one test inbox. Do not clear it.
- **Contract drift** between `api/app/schemas.py` and `web/src/lib/types.ts` is the
  most expensive bug available to us. See `docs/CONTRACTS.md`.
