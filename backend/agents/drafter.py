from schemas.agent_schemas import CivicState, DrafterOutput
from services.gemini_client import get_gemini_client

DRAFTER_SYSTEM_PROMPT = """You are a formal complaint-drafting agent for civic issues in Karachi. You are given: issue type, a factual summary, severity, location, and the authority responsible. Write a short, formal, professional complaint letter addressed to that authority, in a tone appropriate for a government department (respectful, factual, no exaggeration, no emotional language). Include the location and a request for a specific action (inspection, repair, removal, etc.) within a reasonable timeframe. Produce BOTH an English version and an Urdu version. Return ONLY this JSON object, no other text: {"subject": string, "english": string, "urdu": string}. Keep each body under 120 words."""


def draft_complaint(state: CivicState) -> CivicState:
    extra_text = (
        f"Issue type: {state['issue_type']}\n"
        f"Summary: {state['summary']}\n"
        f"Severity: {state['severity']}\n"
        f"Location: {state['location']}\n"
        f"Authority: {state['authority']}\n"
        f"Routing reason: {state.get('authority_reason', '')}"
    )

    result: DrafterOutput = get_gemini_client().generate_json(
        system_prompt=DRAFTER_SYSTEM_PROMPT,
        images=[],
        extra_text=extra_text,
        output_model=DrafterOutput,
    )

    return {
        **state,
        "complaint_subject": result.subject,
        "complaint_english": result.english,
        "complaint_urdu": result.urdu,
    }
