import logging

from schemas.agent_schemas import Verdict, VerificationState, VerifierOutput
from services.openai_client import get_openai_client

logger = logging.getLogger(__name__)

VERIFIER_SYSTEM_PROMPT = """You are a civic-issue fix-verification agent. You will be shown two photos of the same reported location: BEFORE (the original complaint photo) and AFTER (a photo submitted by the responsible authority claiming the issue is fixed). The original issue was classified as: {issue_type}. Original report summary: {original_summary}.

Your job:
1. Describe briefly what the BEFORE photo shows.
2. Describe briefly what the AFTER photo shows.
3. Judge whether the AFTER photo shows the SAME location/vantage point as the BEFORE photo (same road, same angle, same landmarks/background), or whether it looks like a different place, a stock photo, an unrelated image, or a suspiciously edited image. If you cannot reasonably confirm it is the same location, this affects your verdict.
4. Judge whether the SPECIFIC issue described (not unrelated things in the frame) has actually been resolved in the AFTER photo.
5. List any residual problems still visible, even if the main issue looks addressed.

Be skeptical, not generous. A vaguely similar photo with no clear evidence of repair should NOT be marked fixed. If the after-photo does not appear to be the same location, set tamper_flag to true and explain why in tamper_reason, and the verdict should not be 'fixed' regardless of what it shows.

Return ONLY this JSON object, no other text, no markdown fences:
{{
  "verdict": string,
  "confidence": number,
  "reasoning": string,
  "before_description": string,
  "after_description": string,
  "residual_issues": [string],
  "tamper_flag": boolean,
  "tamper_reason": string or null
}}"""

CONFIDENCE_THRESHOLD = 0.55


def verify_fix(state: VerificationState) -> VerificationState:
    system_prompt = VERIFIER_SYSTEM_PROMPT.format(
        issue_type=state["issue_type"],
        original_summary=state["original_summary"],
    )
    extra_text = (
        f"Location: {state['location']}\n"
        "The first image is BEFORE. The second image is AFTER."
    )

    raw_result: VerifierOutput = get_openai_client().generate_json(
        system_prompt=system_prompt,
        images=[state["before_image_url"], state["after_image_url"]],
        extra_text=extra_text,
        output_model=VerifierOutput,
    )

    logger.info(
        "Verifier raw OpenAI response for report %s: verdict=%s confidence=%.2f tamper_flag=%s",
        state["report_id"],
        raw_result.verdict.value,
        raw_result.confidence,
        raw_result.tamper_flag,
    )

    final_verdict = raw_result.verdict.value
    final_confidence = raw_result.confidence
    tamper_flag = raw_result.tamper_flag
    tamper_reason = raw_result.tamper_reason

    if tamper_flag:
        final_verdict = Verdict.INCONCLUSIVE.value
    elif final_confidence < CONFIDENCE_THRESHOLD:
        final_verdict = Verdict.INCONCLUSIVE.value

    if final_verdict != raw_result.verdict.value:
        logger.info(
            "Verifier override for report %s: raw_verdict=%s -> final_verdict=%s "
            "(tamper_flag=%s, confidence=%.2f)",
            state["report_id"],
            raw_result.verdict.value,
            final_verdict,
            tamper_flag,
            final_confidence,
        )

    return {
        **state,
        "verdict": final_verdict,
        "confidence": final_confidence,
        "reasoning": raw_result.reasoning,
        "before_description": raw_result.before_description,
        "after_description": raw_result.after_description,
        "residual_issues": raw_result.residual_issues,
        "tamper_flag": tamper_flag,
        "tamper_reason": tamper_reason,
    }
