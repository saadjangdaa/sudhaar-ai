"""Shared state passed between LangGraph nodes."""

from typing import Optional, TypedDict


class ReportState(TypedDict, total=False):
    # --- input ---
    raw_text: Optional[str]
    media_url: Optional[str]
    media_type: Optional[str]
    area_input: Optional[str]
    language: str

    # --- ingest ---
    transcript: Optional[str]

    # --- classifier ---
    issue_type: str
    summary: str
    confidence: float

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
