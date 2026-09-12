"""
Agent 1 — classifier.

Takes the citizen's text, the voice-note transcript, and/or the photo, and decides
what kind of civic issue this is plus a one-line summary.
"""

import logging
from typing import Literal

from pydantic import BaseModel, Field

from app.config import settings
from app.graph.state import ReportState, input_text
from app.llm import get_llm
from app.transcribe import transcribe_from_url

log = logging.getLogger(__name__)

# TODO(prompt) — Dev A: tighten this. Things worth adding:
#   - Karachi-specific vocabulary (nala, gutter, kachra, gaddha, tanker mafia)
#   - how to disambiguate sewage vs water (standing wastewater vs no supply)
#   - Roman Urdu and Urdu script inputs are both common; handle mixed-language text
#   - keep the summary under ~15 words, neutral and factual, no editorialising
CLASSIFIER_PROMPT = """You are a civic complaint classifier for Karachi, Pakistan.

Classify the reported problem into exactly one issue_type:
- pothole: damaged road surface, broken road, manhole sunk into the carriageway
- sewage: overflowing gutters, standing wastewater, blocked or broken drains
- garbage: uncollected refuse, illegal dumping, open burning of waste
- encroachment: illegal construction or stalls blocking footpaths or roads
- water: no supply, low pressure, burst mains, contaminated drinking water

Also write a short factual summary (max 15 words) and a confidence from 0 to 1.

Input may be English, Urdu, or Roman Urdu. A photo may be attached.
"""


class Classification(BaseModel):
    issue_type: Literal["pothole", "sewage", "garbage", "encroachment", "water"]
    summary: str = Field(description="Factual summary, max 15 words")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)


async def ingest_node(state: ReportState) -> dict:
    """Not an agent — plumbing. Turns a voice note into text before classification."""
    if state.get("media_type") == "audio" and state.get("media_url"):
        return {"transcript": await transcribe_from_url(state["media_url"])}
    return {}


async def classifier_node(state: ReportState) -> dict:
    text = input_text(state)

    if settings.mock_agents:
        # Keyword guess so mock mode still feels responsive during frontend work.
        lowered = text.lower()
        guess = "pothole"
        for word, issue in (
            ("garbage", "garbage"), ("kachra", "garbage"), ("rubbish", "garbage"),
            ("sewage", "sewage"), ("gutter", "sewage"), ("drain", "sewage"),
            ("water", "water"), ("tanker", "water"), ("supply", "water"),
            ("encroach", "encroachment"), ("stall", "encroachment"),
        ):
            if word in lowered:
                guess = issue
                break
        return {
            "issue_type": guess,
            "summary": (text[:80] or "Civic issue reported by a citizen") + " [mock]",
            "confidence": 0.42,
        }

    content: list[dict] = [{"type": "text", "text": text or "See the attached photo."}]
    if state.get("media_type") == "photo" and state.get("media_url"):
        content.append({"type": "image_url", "image_url": {"url": state["media_url"]}})

    try:
        llm = get_llm(temperature=0.0).with_structured_output(Classification)
        result: Classification = await llm.ainvoke(
            [{"role": "system", "content": CLASSIFIER_PROMPT},
             {"role": "user", "content": content}]
        )
        return {
            "issue_type": result.issue_type,
            "summary": result.summary.strip(),
            "confidence": result.confidence,
        }
    except Exception:
        # Never 500 the demo over a bad model response.
        log.warning("classifier failed, falling back", exc_info=True)
        return {
            "issue_type": "pothole",
            "summary": (text[:80] or "Unclassified civic issue"),
            "confidence": 0.0,
        }
