from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app
from routes.reports import _build_process_report_response

client = TestClient(app)


def test_build_process_report_response_low_confidence():
    response = _build_process_report_response(
        {
            "location": "Gulshan-e-Iqbal, Karachi",
            "needs_clarification": True,
            "issue_type": "water",
            "summary": "Unclear image; possible water issue.",
            "severity": "low",
            "confidence": 0.32,
        }
    )

    assert response.needs_clarification is True
    assert response.message is not None
    assert response.issue_type == "water"
    assert response.authority is None
    assert response.complaint_english is None


def test_build_process_report_response_high_confidence():
    response = _build_process_report_response(
        {
            "location": "Gulshan-e-Iqbal, Karachi",
            "needs_clarification": False,
            "issue_type": "pothole",
            "summary": "Large pothole on main road.",
            "severity": "high",
            "confidence": 0.93,
            "authority": "KMC",
            "authority_reason": "KMC handles potholes in this area.",
            "routing_confidence": 0.88,
            "complaint_subject": "Pothole repair request",
            "complaint_english": "Dear KMC, please repair the pothole.",
            "complaint_urdu": "Dear KMC Urdu text",
        }
    )

    assert response.needs_clarification is False
    assert response.message is None
    assert response.authority == "KMC"
    assert response.complaint_english is not None


@patch("routes.reports.get_supabase")
@patch("routes.reports.report_graph")
def test_process_endpoint_returns_clarification_shape(mock_graph, mock_supabase):
    mock_graph.invoke.return_value = {
        "location": "Gulshan-e-Iqbal, Karachi",
        "needs_clarification": True,
        "issue_type": "garbage",
        "summary": "Image too unclear to classify confidently.",
        "severity": "low",
        "confidence": 0.28,
    }

    response = client.post(
        "/agent/process",
        json={
            "image_url": "https://example.com/blurry.jpg",
            "text": "",
            "location": "Gulshan-e-Iqbal, Karachi",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["needs_clarification"] is True
    assert data["message"] is not None
    assert data["authority"] is None
    assert data["complaint_english"] is None
    mock_supabase.assert_not_called()


@patch("routes.reports.get_supabase")
@patch("routes.reports.report_graph")
def test_process_endpoint_returns_full_pipeline_shape(mock_graph, mock_supabase):
    mock_graph.invoke.return_value = {
        "image_url": "https://example.com/pothole.jpg",
        "text": "Large pothole",
        "location": "Gulshan-e-Iqbal, Karachi",
        "needs_clarification": False,
        "issue_type": "pothole",
        "summary": "Large pothole on main road.",
        "severity": "high",
        "confidence": 0.93,
        "authority": "KMC",
        "authority_reason": "KMC handles potholes in this area.",
        "routing_confidence": 0.88,
        "complaint_subject": "Pothole repair request",
        "complaint_english": "Dear KMC, please repair the pothole.",
        "complaint_urdu": "Dear KMC Urdu text",
    }
    mock_supabase.return_value.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "report-123"}
    ]

    response = client.post(
        "/agent/process",
        json={
            "image_url": "https://example.com/pothole.jpg",
            "text": "Large pothole",
            "location": "Gulshan-e-Iqbal, Karachi",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["needs_clarification"] is False
    assert data["message"] is None
    assert data["authority"] == "KMC"
    assert data["complaint_english"] is not None
    mock_supabase.return_value.table.return_value.insert.assert_called_once()
