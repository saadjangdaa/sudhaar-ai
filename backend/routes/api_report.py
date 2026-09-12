import json
import logging
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException

from agents.graph_report import report_graph
from routes.reports import CLARIFICATION_MESSAGE
from schemas.agent_schemas import CivicState, EmailResponse, LegacyReportRequest, LegacyReportResponse
from services.openai_client import OpenAIError
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(tags=["report"])

AUTHORITIES_PATH = Path(__file__).resolve().parent.parent / "data" / "authorities.json"


def _slugify_authority(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
    return slug or "unknown"


def _lookup_authority_email(authority: str) -> str | None:
    with AUTHORITIES_PATH.open(encoding="utf-8") as f:
        authorities = json.load(f)
    for entry in authorities:
        if entry.get("authority") == authority:
            return entry.get("contact_email")
    return None


def _run_graph(payload: LegacyReportRequest) -> CivicState:
    if not payload.raw_text and not payload.media_url:
        raise HTTPException(
            status_code=422,
            detail="Provide raw_text, media_url, or both.",
        )

    initial_state: CivicState = {
        "image_url": payload.media_url or "",
        "text": payload.raw_text or "",
        "location": payload.area_input or "Karachi",
    }

    try:
        return report_graph.invoke(initial_state)
    except OpenAIError as exc:
        logger.exception("OpenAI pipeline failure during /api/report")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/api/report", response_model=LegacyReportResponse)
def create_report(payload: LegacyReportRequest) -> LegacyReportResponse:
    final_state = _run_graph(payload)

    if final_state.get("needs_clarification"):
        raise HTTPException(
            status_code=422,
            detail=CLARIFICATION_MESSAGE,
        )

    authority = final_state["authority"]
    complaint_text = (
        final_state.get("complaint_urdu")
        if payload.language == "ur"
        else final_state.get("complaint_english", "")
    )

    row = {
        "media_url": payload.media_url,
        "media_type": payload.media_type,
        "raw_text": payload.raw_text,
        "transcript": None,
        "issue_type": final_state["issue_type"],
        "summary": final_state["summary"],
        "area_tag": final_state["location"],
        "authority_slug": _slugify_authority(authority),
        "authority_assigned": authority,
        "complaint_text": complaint_text,
        "language": payload.language,
        "upvotes": 0,
        "email_status": None,
    }

    try:
        supabase = get_supabase()
        result = supabase.table("reports").insert(row).execute()
        saved = result.data[0]
    except Exception as exc:
        logger.exception("Failed to save report to Supabase")
        raise HTTPException(
            status_code=502,
            detail=f"Could not save report: {exc}",
        ) from exc

    return LegacyReportResponse(
        id=str(saved["id"]),
        created_at=str(saved["created_at"]),
        media_url=payload.media_url,
        media_type=payload.media_type,
        raw_text=payload.raw_text,
        transcript=None,
        issue_type=final_state["issue_type"],
        summary=final_state["summary"],
        confidence=final_state.get("confidence", 0.0),
        area_tag=final_state["location"],
        authority_slug=_slugify_authority(authority),
        authority_assigned=authority,
        authority_email=_lookup_authority_email(authority),
        routing_reason=final_state.get("authority_reason"),
        complaint_text=complaint_text or "",
        language=payload.language,
        upvotes=0,
        email_status=None,
    )


@router.post("/api/report/{report_id}/email", response_model=EmailResponse)
def email_report(report_id: str) -> EmailResponse:
    return EmailResponse(
        report_id=report_id,
        email_status="skipped",
        detail="Email sending is not enabled on this backend.",
    )
