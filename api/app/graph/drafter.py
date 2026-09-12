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
        )

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
    )


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
        return {"complaint_text": text or _fallback_letter(state)}
    except Exception:
        log.warning("drafter failed, using template letter", exc_info=True)
        return {"complaint_text": _fallback_letter(state)}
