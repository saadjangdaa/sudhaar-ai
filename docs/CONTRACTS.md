# The frozen contract

Three files must say the same thing. Change one, change all three, in one commit,
and say so in the group chat:

| File | Role |
|---|---|
| `api/app/schemas.py` | source of truth (Pydantic, validated at runtime) |
| `web/src/lib/types.ts` | TypeScript mirror |
| this file | what we agreed |

A renamed field does not throw. The frontend just renders `undefined`, and it looks
like a frontend bug for twenty minutes. That is the single most expensive mistake
available to us today, hence this file.

## POST /api/report

Request:

```json
{
  "raw_text": "huge pothole outside my gate, water collects in it",
  "media_url": "https://<project>.supabase.co/storage/v1/object/public/report-media/abc.jpg",
  "media_type": "photo",
  "area_input": "near Hassan Square, gulshan",
  "language": "en"
}
```

- At least one of `raw_text` / `media_url` is required (422 otherwise).
- `media_type`: `"photo" | "audio" | null`. `"audio"` triggers transcription.
- `area_input` is free text. The router normalizes it; it does not have to match.
- `language`: `"en" | "ur"` — the language of the drafted letter.

Response — the stored row, every field present:

```json
{
  "id": "uuid",
  "created_at": "2026-09-12T09:00:00+00:00",
  "media_url": null,
  "media_type": null,
  "raw_text": "huge pothole outside my gate",
  "transcript": null,
  "issue_type": "pothole",
  "summary": "Deep pothole on a residential street collecting water",
  "confidence": 0.9,
  "area_tag": "gulshan_e_iqbal",
  "authority_slug": "kmc",
  "authority_assigned": "Karachi Metropolitan Corporation",
  "authority_email": "complaints@kmc.example.gov.pk",
  "routing_reason": "Pothole complaints in Gulshan-e-Iqbal are handled by KMC.",
  "complaint_text": "To,\nThe concerned officer...",
  "language": "en",
  "upvotes": 0,
  "email_status": null
}
```

- `issue_type`: `pothole | sewage | garbage | encroachment | water`
- `authority_slug`: `kmc | kwsb | sswmb | tma | cbc | malir_cb | faisal_cb`
- `area_tag`: an `AREA_INDEX` key, or `null` when the area could not be identified
- `confidence` comes from the classifier; `0.0` means a fallback was used

## POST /api/report/{id}/email

No body. Returns:

```json
{ "report_id": "uuid", "email_status": "sent", "detail": "delivered to ..." }
```

`email_status` is `sent | failed | skipped`. **`skipped` is not an error** — it is
what you get when `ENABLE_EMAIL=false`, which is the default. Safe to call
unconditionally.

## GET /health

```json
{ "ok": true, "mock_agents": true, "model": "gpt-4o-mini", "email_enabled": false }
```

Call it on page load to wake the Render dyno, which sleeps after ~15 minutes idle
and then takes ~50s to answer.

## Database columns worth knowing

`reports` — what the feed and dashboard read directly with the anon key:

`id, created_at, media_url, raw_text, issue_type, authority_assigned,
complaint_text, area_tag, upvotes, summary, language, media_type, transcript,
email_status, authority_slug`

Upvotes go through the RPC, never a direct update:

```ts
await supabase.rpc("upvote_report", { p_report_id: id, p_session_id: sessionId });
```

It returns the new count, is idempotent per `session_id`, and is race-free.

## Access rules

| Table | From the browser (anon key) |
|---|---|
| `reports` | read only |
| `votes` | nothing — only via `upvote_report()` |
| `authorities` | nothing |
| `notifications` | nothing |

`authorities` and `notifications` have RLS enabled with no policies. The API writes
with the service-role key, and the `/adminauthority` portal reads with a
service-role client from server components only.
