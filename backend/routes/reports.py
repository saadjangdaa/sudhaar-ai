import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from agents.graph_report import report_graph
from schemas.agent_schemas import CivicState, ProcessReportRequest, ProcessReportResponse
from services.openai_client import OpenAIError
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])

CLARIFICATION_MESSAGE = (
    "We could not confidently classify this issue. "
    "Please provide a clearer photo or more detail and resubmit."
)


def _build_process_report_response(final_state: CivicState) -> ProcessReportResponse:
    needs_clarification = bool(final_state.get("needs_clarification"))
    return ProcessReportResponse(
        needs_clarification=needs_clarification,
        message=CLARIFICATION_MESSAGE if needs_clarification else None,
        issue_type=final_state.get("issue_type", ""),
        summary=final_state.get("summary", ""),
        severity=final_state.get("severity", ""),
        confidence=final_state.get("confidence", 0.0),
        location=final_state["location"],
        authority=final_state.get("authority") if not needs_clarification else None,
        authority_reason=(
            final_state.get("authority_reason") if not needs_clarification else None
        ),
        routing_confidence=(
            final_state.get("routing_confidence") if not needs_clarification else None
        ),
        complaint_subject=(
            final_state.get("complaint_subject") if not needs_clarification else None
        ),
        complaint_english=(
            final_state.get("complaint_english") if not needs_clarification else None
        ),
        complaint_urdu=(
            final_state.get("complaint_urdu") if not needs_clarification else None
        ),
    )


@router.post("/process", response_model=ProcessReportResponse)
def process_report(body: ProcessReportRequest) -> ProcessReportResponse:
    initial_state: CivicState = {
        "image_url": body.image_url,
        "text": body.text,
        "location": body.location,
    }
    if body.voice_transcript is not None:
        initial_state["voice_transcript"] = body.voice_transcript

    try:
        final_state = report_graph.invoke(initial_state)
    except OpenAIError as exc:
        logger.exception("OpenAI pipeline failure during report processing")
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    if not final_state.get("needs_clarification"):
        try:
            supabase = get_supabase()
            row = {
                "issue_type": final_state["issue_type"],
                "summary": final_state["summary"],
                "authority_assigned": final_state["authority"],
                "complaint_text": final_state["complaint_english"],
                "area_tag": final_state["location"],
                "media_url": final_state["image_url"],
                "upvotes": 0,
                "verification_status": "unverified",
            }
            supabase.table("reports").insert(row).execute()
        except Exception as exc:
            logger.exception("Failed to save report to Supabase")
            raise HTTPException(
                status_code=502,
                detail=f"Report processed but failed to save: {exc}",
            ) from exc

    return _build_process_report_response(final_state)


@router.get("/health")
def agent_health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
