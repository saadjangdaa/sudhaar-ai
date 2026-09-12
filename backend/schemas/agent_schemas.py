from enum import Enum

from pydantic import BaseModel, Field
from typing_extensions import NotRequired, TypedDict


class IssueType(str, Enum):
    POTHOLE = "pothole"
    SEWAGE = "sewage"
    GARBAGE = "garbage"
    ENCROACHMENT = "encroachment"
    WATER = "water"


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Verdict(str, Enum):
    FIXED = "fixed"
    NOT_FIXED = "not_fixed"
    INCONCLUSIVE = "inconclusive"


class ClassifierOutput(BaseModel):
    issue_type: IssueType
    summary: str
    severity: Severity
    confidence: float = Field(ge=0.0, le=1.0)


class RouterOutput(BaseModel):
    authority: str
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)


class DrafterOutput(BaseModel):
    subject: str
    english: str
    urdu: str


class VerifierOutput(BaseModel):
    verdict: Verdict
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    before_description: str
    after_description: str
    residual_issues: list[str]
    tamper_flag: bool
    tamper_reason: str | None = None


class CivicState(TypedDict):
    # inputs
    image_url: str
    text: str
    voice_transcript: NotRequired[str | None]
    location: str

    # classifier outputs
    issue_type: NotRequired[str]
    summary: NotRequired[str]
    severity: NotRequired[str]
    confidence: NotRequired[float]

    # router outputs
    authority: NotRequired[str]
    authority_reason: NotRequired[str]
    routing_confidence: NotRequired[float]

    # drafter outputs
    complaint_subject: NotRequired[str]
    complaint_english: NotRequired[str]
    complaint_urdu: NotRequired[str]

    # graph terminal flag
    needs_clarification: NotRequired[bool]


class VerificationState(TypedDict):
    report_id: str
    issue_type: str
    original_summary: str
    before_image_url: str
    after_image_url: str
    location: str

    # verifier outputs
    verdict: NotRequired[str]
    confidence: NotRequired[float]
    reasoning: NotRequired[str]
    before_description: NotRequired[str]
    after_description: NotRequired[str]
    residual_issues: NotRequired[list[str]]
    tamper_flag: NotRequired[bool]
    tamper_reason: NotRequired[str | None]


IssueTypeLiteral = str
LanguageLiteral = str
MediaTypeLiteral = str


class LegacyReportRequest(BaseModel):
    """Frontend contract: POST /api/report (mirrors web/src/lib/types.ts)."""

    raw_text: str | None = None
    media_url: str | None = None
    media_type: str | None = None
    area_input: str | None = None
    language: str = "en"


class LegacyReportResponse(BaseModel):
    """Frontend contract: response for POST /api/report."""

    id: str
    created_at: str
    media_url: str | None = None
    media_type: str | None = None
    raw_text: str | None = None
    transcript: str | None = None
    issue_type: str
    summary: str
    confidence: float = 0.0
    area_tag: str | None = None
    authority_slug: str
    authority_assigned: str
    authority_email: str | None = None
    routing_reason: str | None = None
    complaint_text: str
    language: str = "en"
    upvotes: int = 0
    email_status: str | None = None


class EmailResponse(BaseModel):
    report_id: str
    email_status: str
    detail: str | None = None


class ProcessReportRequest(BaseModel):
    image_url: str
    text: str
    voice_transcript: str | None = None
    location: str


class VerifyFixRequest(BaseModel):
    report_id: str
    after_image_url: str


class ProcessReportResponse(BaseModel):
    needs_clarification: bool
    message: str | None = None
    issue_type: str
    summary: str
    severity: str
    confidence: float
    location: str
    authority: str | None = None
    authority_reason: str | None = None
    routing_confidence: float | None = None
    complaint_subject: str | None = None
    complaint_english: str | None = None
    complaint_urdu: str | None = None


class VerifyFixResponse(BaseModel):
    verdict: Verdict
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    before_description: str
    after_description: str
    residual_issues: list[str]
    tamper_flag: bool
    tamper_reason: str | None = None
    report_id: str
    before_image_url: str
    after_image_url: str
    tamper_warning: str | None = None
