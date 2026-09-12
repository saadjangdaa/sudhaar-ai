from agents.classifier import classify_issue
from schemas.agent_schemas import ClassifierOutput, IssueType, Severity


def test_classify_issue_merges_outputs(mock_gemini, base_civic_state):
    mock_gemini.generate_json.return_value = ClassifierOutput(
        issue_type=IssueType.POTHOLE,
        summary="A deep pothole is visible on the road surface.",
        severity=Severity.HIGH,
        confidence=0.91,
    )

    result = classify_issue(base_civic_state)

    assert result["issue_type"] == "pothole"
    assert result["summary"].startswith("A deep pothole")
    assert result["severity"] == "high"
    assert result["confidence"] == 0.91
    mock_gemini.generate_json.assert_called_once()
    call_kwargs = mock_gemini.generate_json.call_args.kwargs
    assert call_kwargs["images"] == [base_civic_state["image_url"]]
    assert "Reporter text" in call_kwargs["extra_text"]
