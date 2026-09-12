"""
FastAPI entrypoint for the Karachi civic reporting pipeline.

    uvicorn main:app --reload --port 8000

Routes:
    GET  /health                    also the Render keep-warm target
    POST /api/report                the core loop
    POST /api/report/{id}/email     auto-email, gated behind ENABLE_EMAIL
"""

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.config import settings
from app.graph.pipeline import run_pipeline
from app.schemas import EmailResponse, ReportRequest, ReportResponse

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("api")

app = FastAPI(title="Karachi Civic Reports API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {
        "ok": True,
        "mock_agents": settings.mock_agents,
        "model": settings.openai_model,
        "email_enabled": settings.enable_email,
    }


@app.post("/api/report", response_model=ReportResponse)
async def create_report(payload: ReportRequest) -> ReportResponse:
    if not payload.raw_text and not payload.media_url:
        raise HTTPException(
            status_code=422,
            detail="Provide raw_text, media_url, or both.",
        )

    state = await run_pipeline(
        raw_text=payload.raw_text,
        media_url=payload.media_url,
        media_type=payload.media_type,
        area_input=payload.area_input,
        language=payload.language,
    )

    row = {
        "media_url": payload.media_url,
        "media_type": payload.media_type,
        "raw_text": payload.raw_text,
        "transcript": state.get("transcript"),
        "issue_type": state.get("issue_type"),
        "summary": state.get("summary"),
        "area_tag": state.get("area_tag"),
        "authority_slug": state.get("authority_slug"),
        "authority_assigned": state.get("authority_assigned"),
        # Why this desk got it. Returned in ReportResponse since the start but not
        # stored until 003, so an authority opening the row saw no justification.
        "routing_reason": state.get("routing_reason"),
        "complaint_text": state.get("complaint_text"),
        "language": payload.language,
        # validator agent
        "status": state.get("status") or "pending",
        "ai_overview": state.get("ai_overview"),
        "validity_confidence": state.get("validity_confidence", 0.0),
        "rejection_reason": state.get("rejection_reason"),
        "evidence_quality": state.get("evidence_quality") or "weak",
    }

    try:
        saved = db.insert_report(row)
    except Exception as exc:
        log.exception("failed to persist report")
        raise HTTPException(status_code=500, detail=f"Could not save report: {exc}") from exc

    rejected = saved.get("status") == "rejected"

    # Authority contact details live in the DB; fall back to None rather than
    # failing the whole request over a missing lookup. A rejected report was never
    # routed, so there is nothing to look up.
    authority_email = None
    if not rejected:
        try:
            authority = db.get_authority_by_slug(saved.get("authority_slug") or "")
            if authority:
                authority_email = authority.get("email")
        except Exception:
            log.warning("authority lookup failed", exc_info=True)

    return ReportResponse(
        id=str(saved["id"]),
        created_at=str(saved["created_at"]),
        media_url=saved.get("media_url"),
        media_type=saved.get("media_type"),
        raw_text=saved.get("raw_text"),
        transcript=saved.get("transcript"),
        issue_type=saved.get("issue_type") or "pothole",
        summary=saved.get("summary") or "",
        confidence=state.get("confidence", 0.0),
        status=saved.get("status") or "pending",
        ai_overview=saved.get("ai_overview"),
        validity_confidence=saved.get("validity_confidence") or 0.0,
        rejection_reason=saved.get("rejection_reason"),
        evidence_quality=saved.get("evidence_quality") or "weak",
        area_tag=saved.get("area_tag"),
        # Empty, not 'kmc', when the report was rejected and never routed.
        authority_slug=saved.get("authority_slug") or ("" if rejected else "kmc"),
        authority_assigned=saved.get("authority_assigned") or "",
        authority_email=authority_email,
        routing_reason=state.get("routing_reason"),
        complaint_text=saved.get("complaint_text") or "",
        language=saved.get("language") or "en",
        upvotes=saved.get("upvotes") or 0,
        email_status=saved.get("email_status"),
    )


@app.post("/api/report/{report_id}/email", response_model=EmailResponse)
async def email_report(report_id: str) -> EmailResponse:
    """Send the drafted complaint to the assigned authority.

    Gated behind ENABLE_EMAIL; returns 'skipped' rather than an error when off, so
    the frontend can call it unconditionally.
    """
    from app.mailer import send_complaint_email

    report = db.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="report not found")

    # A report the validator rejected has no authority and no letter. Sending one
    # would mean mailing an authority about a complaint the system judged fake.
    if report.get("status") == "rejected":
        return EmailResponse(
            report_id=report_id,
            email_status="skipped",
            detail="This report did not pass automated review, so it is not sent to any authority.",
        )

    status, detail = await send_complaint_email(report)
    return EmailResponse(report_id=report_id, email_status=status, detail=detail)
