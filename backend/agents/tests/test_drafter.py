from agents.drafter import draft_complaint
from schemas.agent_schemas import DrafterOutput


def test_draft_complaint_merges_outputs(mock_gemini, base_civic_state):
    mock_gemini.generate_json.return_value = DrafterOutput(
        subject="Request for pothole repair",
        english="Dear KMC, please repair the pothole at Gulshan-e-Iqbal.",
        urdu="محترم KMC، براہ کرم گلشنِ اقبال میں سڑک کی مرمت کریں۔",
    )

    state = {
        **base_civic_state,
        "issue_type": "pothole",
        "summary": "Pothole on main road",
        "severity": "high",
        "authority": "KMC",
        "authority_reason": "KMC maintains roads here.",
    }
    result = draft_complaint(state)

    assert result["complaint_subject"] == "Request for pothole repair"
    assert "KMC" in result["complaint_english"]
    assert "محترم" in result["complaint_urdu"]
