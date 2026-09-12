from agents.verifier import verify_fix
from schemas.agent_schemas import Verdict, VerifierOutput


def test_verify_fix_overrides_tamper_flag(mock_gemini, base_verification_state):
    mock_gemini.generate_json.return_value = VerifierOutput(
        verdict=Verdict.FIXED,
        confidence=0.9,
        reasoning="Issue appears resolved.",
        before_description="Pothole visible.",
        after_description="Smooth road surface.",
        residual_issues=[],
        tamper_flag=True,
        tamper_reason="After photo appears to be a different street.",
    )

    result = verify_fix(base_verification_state)

    assert result["verdict"] == "inconclusive"
    assert result["tamper_flag"] is True
    assert result["tamper_reason"] == "After photo appears to be a different street."
    images = mock_gemini.generate_json.call_args.kwargs["images"]
    assert len(images) == 2


def test_verify_fix_low_confidence_forces_inconclusive(mock_gemini, base_verification_state):
    mock_gemini.generate_json.return_value = VerifierOutput(
        verdict=Verdict.FIXED,
        confidence=0.4,
        reasoning="Uncertain repair evidence.",
        before_description="Pothole visible.",
        after_description="Partially filled area.",
        residual_issues=["Uneven surface"],
        tamper_flag=False,
        tamper_reason=None,
    )

    result = verify_fix(base_verification_state)

    assert result["verdict"] == "inconclusive"
    assert result["confidence"] == 0.4
