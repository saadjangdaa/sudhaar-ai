from agents.router import route_issue
from schemas.agent_schemas import RouterOutput


def test_route_issue_uses_gemini_shortlist(mock_gemini, base_civic_state):
    mock_gemini.generate_json.return_value = RouterOutput(
        authority="KMC",
        reason="KMC handles potholes in this area.",
        confidence=0.88,
    )

    state = {
        **base_civic_state,
        "issue_type": "pothole",
        "summary": "Pothole on service road",
        "severity": "medium",
        "confidence": 0.9,
    }
    result = route_issue(state)

    assert result["authority"] == "KMC"
    assert result["routing_confidence"] == 0.88
    extra = mock_gemini.generate_json.call_args.kwargs["extra_text"]
    assert "KMC" in extra


def test_route_issue_fallback_when_no_candidates(mock_gemini, base_civic_state):
    state = {
        **base_civic_state,
        "issue_type": "nonexistent_issue",
        "summary": "Unknown issue",
        "severity": "low",
        "confidence": 0.9,
    }
    result = route_issue(state)

    assert result["authority"] == "Town Administration"
    assert result["routing_confidence"] == 0.3
    mock_gemini.generate_json.assert_not_called()
