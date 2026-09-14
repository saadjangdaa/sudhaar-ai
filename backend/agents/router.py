import json
from pathlib import Path

from schemas.agent_schemas import CivicState, RouterOutput
from services.gemini_client import get_gemini_client

AUTHORITIES_PATH = Path(__file__).resolve().parent.parent / "data" / "authorities.json"

ROUTER_SYSTEM_PROMPT = """You are a routing agent for Karachi civic complaints. You are given a reported issue (type, summary, severity, location) and a shortlist of candidate authorities with the issue types and areas each one handles. Pick exactly one authority from the shortlist that is the best-fit owner of this issue. If two authorities plausibly overlap, prefer the more specific one (e.g. a dedicated solid-waste board over a generic town administration) and explain the tradeoff in one sentence. Return ONLY this JSON object, no other text: {"authority": string, "reason": string (one sentence), "confidence": number between 0 and 1}. Only choose an authority that appears in the shortlist provided — never invent one."""

FALLBACK_AUTHORITY = "Town Administration"
FALLBACK_REASON = (
    "No specific authority match found; routed to general town administration for triage."
)
FALLBACK_CONFIDENCE = 0.3


def _load_authorities() -> list[dict]:
    with AUTHORITIES_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def _location_matches(areas: list[str], location: str) -> bool:
    location_lower = location.lower()
    for area in areas:
        if area == "*":
            return True
        if area.lower() in location_lower or location_lower in area.lower():
            return True
    return False


def _filter_candidates(issue_type: str, location: str) -> list[dict]:
    authorities = _load_authorities()
    by_issue = [a for a in authorities if issue_type in a.get("issues", [])]
    if not by_issue:
        return []

    location_matches = [a for a in by_issue if _location_matches(a.get("areas", []), location)]
    if location_matches:
        return location_matches
    return by_issue


def route_issue(state: CivicState) -> CivicState:
    candidates = _filter_candidates(state["issue_type"], state["location"])

    if not candidates:
        return {
            **state,
            "authority": FALLBACK_AUTHORITY,
            "authority_reason": FALLBACK_REASON,
            "routing_confidence": FALLBACK_CONFIDENCE,
        }

    extra_text = (
        f"Issue type: {state['issue_type']}\n"
        f"Summary: {state['summary']}\n"
        f"Severity: {state['severity']}\n"
        f"Location: {state['location']}\n\n"
        f"Candidate authorities:\n{json.dumps(candidates, indent=2)}"
    )

    result: RouterOutput = get_gemini_client().generate_json(
        system_prompt=ROUTER_SYSTEM_PROMPT,
        images=[],
        extra_text=extra_text,
        output_model=RouterOutput,
    )

    allowed = {c["authority"] for c in candidates}
    if result.authority not in allowed:
        return {
            **state,
            "authority": FALLBACK_AUTHORITY,
            "authority_reason": FALLBACK_REASON,
            "routing_confidence": FALLBACK_CONFIDENCE,
        }

    return {
        **state,
        "authority": result.authority,
        "authority_reason": result.reason,
        "routing_confidence": result.confidence,
    }
