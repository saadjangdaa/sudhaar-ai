from unittest.mock import MagicMock

import pytest

from schemas.agent_schemas import (
    ClassifierOutput,
    DrafterOutput,
    IssueType,
    RouterOutput,
    Severity,
    Verdict,
    VerifierOutput,
)
from services import gemini_client


@pytest.fixture(autouse=True)
def reset_gemini_client():
    gemini_client.set_gemini_client(None)
    yield
    gemini_client.set_gemini_client(None)


@pytest.fixture
def mock_gemini():
    client = MagicMock()
    gemini_client.set_gemini_client(client)
    return client


@pytest.fixture
def base_civic_state():
    return {
        "image_url": "https://example.com/pothole.jpg",
        "text": "Large pothole on main road",
        "location": "Gulshan-e-Iqbal, Karachi",
    }


@pytest.fixture
def base_verification_state():
    return {
        "report_id": "test-report-001",
        "issue_type": "pothole",
        "original_summary": "Deep pothole near traffic signal",
        "before_image_url": "https://example.com/before.jpg",
        "after_image_url": "https://example.com/after.jpg",
        "location": "Gulshan-e-Iqbal, Karachi",
    }
