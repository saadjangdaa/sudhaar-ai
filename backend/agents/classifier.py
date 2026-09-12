from schemas.agent_schemas import CivicState, ClassifierOutput
from services.openai_client import get_openai_client

CLASSIFIER_SYSTEM_PROMPT = """You are a Karachi civic issue classification agent. You will be shown a photo of a civic issue and optionally a short description or voice transcript from the reporter. Classify the issue into EXACTLY ONE of these categories: pothole, sewage, garbage, encroachment, water. Assess severity as low, medium, or high based on visible scale, safety risk, and any text provided. Give a confidence score between 0 and 1 reflecting how certain you are about the category (not the severity). Return ONLY a single valid JSON object with these exact keys and no other text, no markdown fences: {"issue_type": string, "summary": string (one sentence, factual, non-dramatic), "severity": string, "confidence": number}.
If the image does not clearly show a civic issue, or you cannot tell, set issue_type to the closest plausible category and confidence below 0.4."""


def classify_issue(state: CivicState) -> CivicState:
    extra_parts = [f"Reporter text: {state['text']}"]
    voice = state.get("voice_transcript")
    if voice:
        extra_parts.append(f"Voice transcript: {voice}")
    extra_parts.append(f"Location: {state['location']}")
    extra_text = "\n".join(extra_parts)

    result: ClassifierOutput = get_openai_client().generate_json(
        system_prompt=CLASSIFIER_SYSTEM_PROMPT,
        images=[state["image_url"]],
        extra_text=extra_text,
        output_model=ClassifierOutput,
    )

    return {
        **state,
        "issue_type": result.issue_type.value,
        "summary": result.summary,
        "severity": result.severity.value,
        "confidence": result.confidence,
    }
