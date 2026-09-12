"""Shared state passed between LangGraph nodes."""

from typing import Optional, TypedDict


class ReportState(TypedDict, total=False):
    # --- input ---
    raw_text: Optional[str]
    media_url: Optional[str]
    media_type: Optional[str]
    area_input: Optional[str]
    # Optional GPS pin. Read by the drafter, which puts it in the letter; the
    # router deliberately ignores it, see the note in router.py.
    latitude: Optional[float]
    longitude: Optional[float]
    accuracy_m: Optional[float]
    language: str

    # --- ingest ---
    transcript: Optional[str]

    # --- classifier ---
    issue_type: str
    summary: str
    confidence: float

    # --- validator ---
    # 'pending'  = published on the public feed
    # 'rejected' = hidden from the public feed, router and drafter skipped
    status: str
    is_valid: bool
    validity_confidence: float
    rejection_reason: Optional[str]
    ai_overview: Optional[str]
    evidence_quality: str

    # --- router ---
    area_tag: Optional[str]
    authority_slug: str
    authority_assigned: str
    authority_email: Optional[str]
    routing_reason: Optional[str]

    # --- drafter ---
    complaint_text: str


def input_text(state: ReportState) -> str:
    """Everything the citizen told us, in one string."""
    parts = [state.get("raw_text"), state.get("transcript")]
    return "\n".join(p.strip() for p in parts if p and p.strip())
