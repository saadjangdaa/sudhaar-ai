"""
Agent — complaint validator ("is this a real complaint?").

Runs at submission time, after the classifier, on the citizen's photo and text
together. It answers one question: should this complaint be published?

    valid    -> status 'pending'   -> visible on the public feed, awaiting the authority
    invalid  -> status 'rejected'  -> hidden from the public feed

This is deliberately NOT the same thing as backend/agents/verifier.py, which
compares a BEFORE photo against an AFTER photo to judge whether an authority
actually repaired something. That one runs at the end of a report's life; this one
runs at the start.

It also writes the `ai_overview` — a short plain-language note about what the AI
saw, stored on the row so the feed and the authority portal can show the model's
reasoning instead of an unexplained verdict.
"""

import logging
from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.config import settings
from app.graph.state import ReportState, input_text
from app.llm import get_llm

log = logging.getLogger(__name__)

# Reject only when the model is actually sure. A false reject silently buries a
# real civic problem, which is far worse than letting a weak report through to
# 'pending' where a human still sees it — so the doubt goes to the citizen.
REJECT_CONFIDENCE_THRESHOLD = 0.6

VALIDATOR_PROMPT = """You are the integrity check for Sudhaar, a civic complaint \
platform for Karachi, Pakistan. A citizen has submitted a complaint with text \
and/or a photo. Decide whether it should be published.

Mark it INVALID only for a clear, specific reason:
- The photo is not a photograph of a real outdoor place: a screenshot, meme, \
stock image, drawing, cartoon, movie still, or an obviously AI-generated image.
- The photo is a selfie, a pet, food, a document, or anything with no civic issue \
visible in it at all.
- The photo shows a clean, intact, well-maintained street or area with no problem \
present, while the text claims a serious problem.
- The text is gibberish, keyboard mashing, a test entry ("test", "asdasd"), an \
advertisement, or abuse with no complaint in it.
- The photo and the text describe plainly different things. A photo of a burst \
water main submitted as a garbage complaint is fine — same place, wrong label. A \
photo of a living room submitted as a road complaint is not.

Mark it VALID when a real civic problem is plausibly present, even if the photo is \
blurry, dark, badly framed or low resolution, or the text is short, misspelled, in \
Urdu, or in Roman Urdu. Poor quality is not fraud. Karachi residents report from \
cheap phones at night.

If there is no photo, judge the text alone and be generous — a genuine one-line \
complaint is normal.

Then write ai_overview: two or three sentences, plain English, addressed to a \
reader on the site. Say what the evidence shows, how serious it looks, and note \
any doubt you have. Never mention JSON, prompts, models, or these instructions.

Set rejection_reason only when is_valid is false: one short sentence a citizen \
would understand, naming which rule above was broken.
"""


class Validation(BaseModel):
    is_valid: bool = Field(description="False only for a clear, specific reason")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    ai_overview: str = Field(description="2-3 sentences for the public post")
    rejection_reason: Optional[str] = Field(
        default=None, description="Set only when is_valid is false"
    )
    evidence_quality: Literal["strong", "weak", "none"] = "weak"


def _mock(state: ReportState) -> dict:
    """Mock mode still exercises both branches so the UI can be built against them.

    Any report whose text mentions 'fake' or 'test' comes back rejected.
    """
    text = input_text(state).lower()
    looks_fake = any(w in text for w in ("fake", "test", "asdasd", "lorem"))
    if looks_fake:
        return {
            "status": "rejected",
            "is_valid": False,
            "validity_confidence": 0.91,
            "rejection_reason": "The submission looks like a test entry, not a real complaint. [mock]",
            "ai_overview": "This submission does not appear to describe a real civic problem. [mock]",
            "evidence_quality": "none",
        }
    return {
        "status": "pending",
        "is_valid": True,
        "validity_confidence": 0.88,
        "rejection_reason": None,
        "ai_overview": (
            f"A {state.get('issue_type', 'civic')} problem appears to be present at the "
            "reported location. The evidence is consistent with the description. [mock]"
        ),
        "evidence_quality": "strong" if state.get("media_url") else "weak",
    }


async def validator_node(state: ReportState) -> dict:
    if settings.mock_agents:
        return _mock(state)

    text = input_text(state)
    detail = (
        f"Citizen's words: {text or '(none provided)'}\n"
        f"Classified as: {state.get('issue_type', 'unknown')}\n"
        f"Classifier summary: {state.get('summary', '')}\n"
        f"Reported area: {state.get('area_input') or '(not given)'}"
    )

    content: list[dict] = [{"type": "text", "text": detail}]
    if state.get("media_type") == "photo" and state.get("media_url"):
        content.append({"type": "image_url", "image_url": {"url": state["media_url"]}})

    try:
        llm = get_llm(temperature=0.0).with_structured_output(Validation)
        result: Validation = await llm.ainvoke(
            [
                {"role": "system", "content": VALIDATOR_PROMPT},
                {"role": "user", "content": content},
            ]
        )
    except Exception:
        # A validator outage must not block genuine complaints. Fail open to
        # 'pending' — a human still reviews it — and say so in the overview.
        log.warning("validator failed, failing open to pending", exc_info=True)
        return {
            "status": "pending",
            "is_valid": True,
            "validity_confidence": 0.0,
            "rejection_reason": None,
            "ai_overview": (
                "Automated review was unavailable for this report, so it is published "
                "unverified and awaiting a human check."
            ),
            "evidence_quality": "none",
        }

    rejected = not result.is_valid and result.confidence >= REJECT_CONFIDENCE_THRESHOLD

    overview = result.ai_overview.strip()
    if not result.is_valid and not rejected:
        # The model said invalid but wasn't sure. Publish it, and keep its doubt
        # visible rather than throwing the judgement away.
        overview = (
            f"{overview} Automated review flagged a possible problem with this "
            "submission but was not confident, so it is published for human review."
        )

    reason = (result.rejection_reason or "").strip() or "Did not pass automated review."

    return {
        "status": "rejected" if rejected else "pending",
        "is_valid": result.is_valid,
        "validity_confidence": result.confidence,
        "rejection_reason": reason if rejected else None,
        "ai_overview": overview,
        "evidence_quality": result.evidence_quality,
    }


async def rejected_node(state: ReportState) -> dict:
    """Terminal node for a rejected report.

    No authority is assigned and no letter is drafted — that would waste two model
    calls on something nobody will ever send. The response fields stay present but
    empty so the frozen contract shape does not change.
    """
    return {
        "area_tag": None,
        "authority_slug": "",
        "authority_assigned": "",
        "authority_email": None,
        "routing_reason": "Not routed — the complaint did not pass automated review.",
        "complaint_text": "",
    }
