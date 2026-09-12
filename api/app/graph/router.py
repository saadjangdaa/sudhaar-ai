"""
Agent 2 — router.

The LLM has exactly one job here: normalize a messy free-text location to a known
area key. The authority decision itself is a deterministic table lookup, so the
model cannot invent a department that does not exist.
"""

import logging

from pydantic import BaseModel, Field

from app.authorities import AREA_INDEX, AUTHORITY_NAMES, match_area, route
from app.config import settings
from app.graph.state import ReportState, input_text
from app.llm import get_llm

log = logging.getLogger(__name__)

_AREA_LIST = "\n".join(f"- {k}: {v['name']}" for k, v in AREA_INDEX.items())

# TODO(prompt) — Dev A: add real landmark hints, they carry most of the signal.
#   e.g. Hassan Square / NIPA -> gulshan_e_iqbal, Teen Talwar -> clifton,
#   Empress Market / Zainab Market -> saddar, Sohrab Goth -> gadap,
#   Korangi Crossing -> korangi. Note Nazimabad and North Nazimabad differ.
ROUTER_PROMPT = f"""You map a free-text Karachi location to exactly one area key.

Known areas:
{_AREA_LIST}

Rules:
- Return the area key only, chosen from the list above.
- Resolve landmarks, roads and neighbourhood names to their parent area.
- If the location is genuinely unidentifiable, return "unknown".
"""


class AreaMatch(BaseModel):
    area_key: str = Field(description="One key from the list above, or unknown")


async def router_node(state: ReportState) -> dict:
    area_input = state.get("area_input") or ""
    issue_type = state.get("issue_type", "pothole")

    # Deterministic match first — it is free and usually correct.
    area_tag = match_area(area_input)

    if area_tag is None and area_input and not settings.mock_agents:
        try:
            llm = get_llm(temperature=0.0).with_structured_output(AreaMatch)
            snippet = input_text(state)[:300]
            result: AreaMatch = await llm.ainvoke(
                [
                    {"role": "system", "content": ROUTER_PROMPT},
                    {"role": "user", "content": f"Location: {area_input}\n\nReport: {snippet}"},
                ]
            )
            if result.area_key in AREA_INDEX:
                area_tag = result.area_key
        except Exception:
            log.warning("router normalization failed, using fallback match", exc_info=True)

    slug, reason = route(issue_type, area_tag)

    # Contact details are read from public.authorities at send time; the name here
    # is a fallback so routing still works if that lookup fails.
    return {
        "area_tag": area_tag,
        "authority_slug": slug,
        "authority_assigned": AUTHORITY_NAMES.get(slug, "Karachi Metropolitan Corporation"),
        "routing_reason": reason,
    }
