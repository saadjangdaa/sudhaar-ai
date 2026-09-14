import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from agents.graph_verify import verify_graph
from schemas.agent_schemas import (
    VerificationState,
    VerifyFixRequest,
    VerifyFixResponse,
    VerifierOutput,
    Verdict,
)
from services.gemini_client import GeminiError
from services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/verify-fix", response_model=VerifyFixResponse)
def verify_fix_endpoint(body: VerifyFixRequest) -> VerifyFixResponse:
    try:
        supabase = get_supabase()
        result = (
            supabase.table("reports")
            .select("id, media_url, issue_type, summary, area_tag")
            .eq("id", body.report_id)
            .single()
            .execute()
        )
    except Exception as exc:
        logger.exception("Failed to fetch report %s", body.report_id)
        raise HTTPException(status_code=404, detail="Report not found") from exc

    report = result.data
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    initial_state: VerificationState = {
        "report_id": str(report["id"]),
        "issue_type": report["issue_type"],
        "original_summary": report.get("summary") or "",
        "before_image_url": report["media_url"],
        "after_image_url": body.after_image_url,
        "location": report.get("area_tag") or "",
    }

    try:
        final_state = verify_graph.invoke(initial_state)
    except GeminiError as exc:
        logger.exception("Gemini pipeline failure during fix verification")
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    output = VerifierOutput(
        verdict=Verdict(final_state["verdict"]),
        confidence=final_state["confidence"],
        reasoning=final_state["reasoning"],
        before_description=final_state["before_description"],
        after_description=final_state["after_description"],
        residual_issues=final_state.get("residual_issues", []),
        tamper_flag=final_state.get("tamper_flag", False),
        tamper_reason=final_state.get("tamper_reason"),
    )

    try:
        supabase.table("reports").update(
            {
                "after_image_url": body.after_image_url,
                "verification_status": output.verdict.value,
                "verification_confidence": output.confidence,
                "verification_reason": output.reasoning,
                "tamper_flag": output.tamper_flag,
                "verified_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", body.report_id).execute()
    except Exception as exc:
        logger.exception("Failed to update report %s with verification", body.report_id)
        raise HTTPException(
            status_code=502,
            detail=f"Verification completed but failed to save: {exc}",
        ) from exc

    return VerifyFixResponse(
        verdict=output.verdict,
        confidence=output.confidence,
        reasoning=output.reasoning,
        before_description=output.before_description,
        after_description=output.after_description,
        residual_issues=output.residual_issues,
        tamper_flag=output.tamper_flag,
        tamper_reason=output.tamper_reason,
        report_id=body.report_id,
        before_image_url=initial_state["before_image_url"],
        after_image_url=body.after_image_url,
        tamper_warning=(
            output.tamper_reason
            if output.tamper_flag and output.tamper_reason
            else None
        ),
    )
