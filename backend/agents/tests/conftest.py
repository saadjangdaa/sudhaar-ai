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
from services import openai_client


@pytest.fixture(autouse=True)
def reset_openai_client():
    openai_client.set_openai_client(None)
    yield
    openai_client.set_openai_client(None)


@pytest.fixture
def mock_openai():
    client = MagicMock()
    openai_client.set_openai_client(client)
    return client


# Backward-compatible alias used by existing tests
@pytest.fixture
def mock_gemini(mock_openai):
    return mock_openai


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
