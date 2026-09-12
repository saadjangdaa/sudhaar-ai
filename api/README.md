# api — FastAPI + LangGraph pipeline

**Owner: [teammate]. Nobody else commits in this folder.**

## Run it

```bash
cd api
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # then fill it in
uvicorn main:app --reload --port 8000
```

`MOCK_AGENTS=true` is the default, so it runs with **no OpenAI key at all** — every
agent returns canned output in the correct shape. That is what is deployed right
now, and it is what the frontend is being built against.

```bash
curl -s localhost:8000/health

curl -s -X POST localhost:8000/api/report \
  -H "content-type: application/json" \
  -d "{\"raw_text\":\"huge pothole outside my gate\",\"area_input\":\"gulshan\",\"language\":\"en\"}"
```

## The one rule

`app/schemas.py` is a **frozen contract**, mirrored in `web/src/lib/types.ts` and
documented in `docs/CONTRACTS.md`. Renaming a response field breaks the frontend
silently and it will look like their bug. Announce it, and change all three files
in the same commit. Everything *behind* the contract is yours to rewrite freely.

## Your tasks, in order

1. **Real prompts.** Search for `TODO(prompt)` — there are three, one per agent:
   - `app/graph/classifier.py` — issue type + summary. Vision already wired: a
     photo URL is passed as an `image_url` block. Add Karachi vocabulary (nala,
     kachra, gaddha) and handle Urdu plus Roman Urdu.
   - `app/graph/router.py` — the model only normalizes a fuzzy area string to an
     `AREA_INDEX` key. Add landmark hints (Hassan Square, Teen Talwar, Sohrab
     Goth). **Do not let the model choose the authority** — that is a table lookup
     in `app/authorities.py` on purpose, so it cannot invent a department.
   - `app/graph/drafter.py` — the complaint letter, English and Urdu. This is what
     judges read. Both a prompt and a template fallback already exist.
2. **Flip `MOCK_AGENTS=false`** locally, test all three input types (text, photo,
   voice note), then flip it in Render. Tell the frontend owner before you do.
3. **Gmail SMTP** (`app/mailer.py`). Needs 2FA on the account and a 16-character
   app password, not the account password. **Keep `EMAIL_OVERRIDE_TO` set to your
   own address** — the seeded authority emails are invented placeholders and this
   must not mail real departments. Test from the **deployed** API too: Render free
   tier may block outbound SMTP.
4. **Nothing else.** The notification insert in `mailer.py` is already written and
   deliberately wrapped in try/except so it can never affect an email send. Leave
   that shape alone.

## Layout

```
main.py                 routes: /health, /api/report, /api/report/{id}/email
app/config.py           env vars
app/schemas.py          FROZEN CONTRACT
app/authorities.py      area -> authority rules (18 areas, 7 authorities)
app/graph/pipeline.py   ingest -> classifier -> router -> drafter
app/graph/state.py      shared state
app/db.py               Supabase, service-role only
app/mailer.py           Gmail SMTP + the notification hook
app/transcribe.py       voice notes via OpenAI
```

Every node has a fallback so a bad model response degrades the report instead of
returning a 500. Keep it that way — a 500 during the demo is unrecoverable, a
slightly wrong classification is not.
