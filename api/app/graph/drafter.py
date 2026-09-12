"""
Agent 3 — drafter.

Turns the classification plus routing result into a formal complaint letter, in
English or Urdu.
"""

import logging

from app.config import settings
from app.graph.state import ReportState, input_text
from app.llm import get_llm

log = logging.getLogger(__name__)

# TODO(prompt) — Dev A: this is the output judges actually read. Worth adding:
#   - the register of a real Pakistani complaint letter (a subject line,
#     "It is submitted that...", a request for a time-bound response)
#   - name the area and issue explicitly in the subject
#   - keep under ~200 words; ask for an acknowledgement and complaint number
#   - Urdu output must read as natural Urdu, not translated English
DRAFTER_PROMPT_EN = """You draft formal civic complaint letters to Karachi authorities.

Write a complete, polite, firm complaint letter in English. Include:
- a "Subject:" line naming the issue and the area
- the specific problem and its impact on residents
- a clear request for action within a reasonable timeframe
- a request for an acknowledgement and a complaint reference number

Do not invent names, addresses, dates or phone numbers, and do not leave
bracketed placeholders such as [Your Name], [Address] or [Date] anywhere in the
letter — the citizen is anonymous, so omit those lines entirely. Start directly
with the recipient authority, then the subject line. Sign off as
"A concerned resident". Keep it under 200 words.
"""

DRAFTER_PROMPT_UR = """آپ کراچی کے سرکاری اداروں کے لیے شکایتی خطوط لکھتے ہیں۔

مکمل، مہذب اور واضح شکایتی خط اردو میں لکھیں۔ اس میں شامل ہو:
- "موضوع:" کی سطر جس میں مسئلہ اور علاقہ ہو
- مسئلے کی تفصیل اور رہائشیوں پر اس کے اثرات
- کارروائی کی واضح درخواست اور مناسب مہلت
- رسید اور شکایت نمبر کی درخواست

فرضی نام، پتے، تاریخیں یا فون نمبر مت لکھیں، اور [آپ کا نام] جیسے خالی خانے
بھی مت چھوڑیں — شہری گمنام ہے، اس لیے یہ سطریں بالکل شامل نہ کریں۔ خط کا آغاز
متعلقہ ادارے کے نام سے کریں، پھر موضوع کی سطر۔ آخر میں "ایک فکرمند شہری" لکھیں۔
تقریباً 200 الفاظ سے کم رکھیں۔
"""


# A pin this coarse is a neighbourhood, not a location. Above it the coordinates
# are dropped from the letter rather than sent to a crew as if they were a spot:
# a browser reporting 3 km of uncertainty is usually reading wifi, not GPS.
MAX_USEFUL_ACCURACY_M = 500.0


def _location_block(state: ReportState) -> str:
    """The GPS pin as a labelled block appended to the letter, or "".

    Appended deterministically instead of being passed to the model and asked for
    politely. A mangled coordinate or a broken map URL sends a repair crew to the
    wrong street, and a model that is told not to invent addresses cannot be
    relied on to reproduce eleven digits it was handed. The letter's prose is the
    model's job; the coordinates are not.
    """
    lat, lng = state.get("latitude"), state.get("longitude")
    if lat is None or lng is None:
        return ""

    accuracy = state.get("accuracy_m")
    if accuracy is not None and accuracy > MAX_USEFUL_ACCURACY_M:
        return ""

    pin = f"{lat:.5f}, {lng:.5f}"
    url = f"https://www.google.com/maps?q={lat:.5f},{lng:.5f}"

    if state.get("language") == "ur":
        block = f"\n\nمقام: {pin}\nنقشہ: {url}"
        if accuracy is not None:
            block += f"\n(تقریباً {round(accuracy)} میٹر کی درستگی کے ساتھ۔)"
        return block

    block = f"\n\nExact location of the reported issue: {pin}\nMap: {url}"
    if accuracy is not None:
        block += f"\n(Reported accurate to about {round(accuracy)} m.)"
    return block


def _fallback_letter(state: ReportState) -> str:
    """Template letter. Used in mock mode and whenever the model call fails."""
    authority = state.get("authority_assigned", "the concerned authority")
    area = state.get("area_tag") or "the reported area"
    issue = state.get("issue_type", "civic")
    summary = state.get("summary") or input_text(state) or "a civic issue"

    if state.get("language") == "ur":
        return (
            f"بخدمت جناب،\n{authority}\n\n"
            f"موضوع: {area} میں {issue} کی شکایت\n\n"
            f"گزارش ہے کہ {summary}۔ اس مسئلے سے علاقے کے رہائشیوں کو شدید دشواری کا "
            f"سامنا ہے۔ براہِ کرم فوری کارروائی کی جائے اور اس شکایت کی رسید و شکایت "
            f"نمبر فراہم کیا جائے۔\n\nشکریہ،\nایک فکرمند شہری"
        ) + _location_block(state)

    return (
        f"To,\nThe concerned officer\n{authority}\n\n"
        f"Subject: {issue.title()} complaint in {area}\n\n"
        f"Respected Sir/Madam,\n\n"
        f"It is submitted that {summary}. This is causing considerable difficulty "
        f"to residents of the area and poses a risk to public safety.\n\n"
        f"You are requested to arrange an inspection and carry out the necessary "
        f"remedial work at the earliest. Kindly acknowledge this complaint and "
        f"provide a complaint reference number.\n\n"
        f"Thank you,\nA concerned resident"
    ) + _location_block(state)


async def drafter_node(state: ReportState) -> dict:
    if settings.mock_agents:
        return {"complaint_text": _fallback_letter(state) + "\n\n[mock draft]"}

    language = state.get("language", "en")
    prompt = DRAFTER_PROMPT_UR if language == "ur" else DRAFTER_PROMPT_EN

    area = state.get("area_tag") or state.get("area_input") or "unspecified"
    details = (
        f"Issue type: {state.get('issue_type')}\n"
        f"Summary: {state.get('summary')}\n"
        f"Area: {area}\n"
        f"Authority: {state.get('authority_assigned')}\n"
        f"Citizen's own words: {input_text(state)[:600]}"
    )

    try:
        llm = get_llm(temperature=0.4)
        result = await llm.ainvoke(
            [
                {"role": "system", "content": prompt},
                {"role": "user", "content": details},
            ]
        )
        text = result.content.strip() if isinstance(result.content, str) else ""
        if not text:
            return {"complaint_text": _fallback_letter(state)}
        return {"complaint_text": text + _location_block(state)}
    except Exception:
        log.warning("drafter failed, using template letter", exc_info=True)
        return {"complaint_text": _fallback_letter(state)}
