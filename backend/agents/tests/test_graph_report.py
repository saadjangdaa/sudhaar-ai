from unittest.mock import patch

from agents.graph_report import report_graph
from schemas.agent_schemas import ClassifierOutput, DrafterOutput, IssueType, RouterOutput, Severity


def test_graph_routes_to_needs_clarification_when_low_confidence(base_civic_state):
    classifier_out = ClassifierOutput(
        issue_type=IssueType.GARBAGE,
        summary="Possible garbage pile.",
        severity=Severity.LOW,
        confidence=0.35,
    )

    with patch("agents.classifier.get_gemini_client") as mock_get:
        mock_get.return_value.generate_json.return_value = classifier_out
        result = report_graph.invoke(base_civic_state)

    assert result.get("needs_clarification") is True
    assert "authority" not in result


def test_graph_completes_full_pipeline(base_civic_state):
    classifier_out = ClassifierOutput(
        issue_type=IssueType.POTHOLE,
        summary="Large pothole on road.",
        severity=Severity.HIGH,
        confidence=0.92,
    )
    router_out = RouterOutput(
        authority="KMC",
        reason="KMC handles potholes in Gulshan-e-Iqbal.",
        confidence=0.85,
    )
    drafter_out = DrafterOutput(
        subject="Pothole repair request",
        english="Dear KMC, please repair the pothole.",
        urdu="محترم KMC، سڑک مرمت کریں۔",
    )

    with (
        patch("agents.classifier.get_gemini_client") as mock_cls,
        patch("agents.router.get_gemini_client") as mock_rtr,
        patch("agents.drafter.get_gemini_client") as mock_dft,
    ):
        mock_cls.return_value.generate_json.return_value = classifier_out
        mock_rtr.return_value.generate_json.return_value = router_out
        mock_dft.return_value.generate_json.return_value = drafter_out
        result = report_graph.invoke(base_civic_state)

    assert result["authority"] == "KMC"
    assert result["complaint_english"].startswith("Dear KMC")
    assert result.get("needs_clarification") is not True
