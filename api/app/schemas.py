"""
FROZEN API CONTRACT — mirrored in web/src/lib/types.ts and documented in
docs/CONTRACTS.md.

Changing a field name here breaks the frontend silently. Announce it in the group
chat and update all three places in the same commit.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

IssueType = Literal["pothole", "sewage", "garbage", "encroachment", "water"]
Language = Literal["en", "ur"]
MediaType = Literal["photo", "audio"]
# One lifecycle, two owners. The validator agent sets 'rejected' or 'pending';
# the authority desk moves 'pending' -> 'in_progress' -> 'fixed'.
# 'rejected' rows are hidden from the public feed and from the authority desk.
# Keep in step with web/src/lib/types.ts, web/src/lib/admin/types.ts and the
# reports_status_check constraint in supabase/schema.sql.
ReportStatus = Literal["pending", "in_progress", "fixed", "rejected"]
EvidenceQuality = Literal["strong", "weak", "none"]


class ReportRequest(BaseModel):
    """What the browser POSTs to /api/report.

    At least one of raw_text / media_url must be present. The browser uploads the
    file to Supabase Storage itself and sends us the resulting public URL.
    """

    raw_text: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[MediaType] = None
    area_input: Optional[str] = Field(
        default=None,
        description="Free-text area, e.g. 'near Hassan Square, gulshan'. The router normalizes it.",
    )
    language: Language = "en"

    # Optional GPS pin, captured only when the citizen presses the button.
    # area_input routes the complaint; this is what lets a crew find the thing.
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    accuracy_m: Optional[float] = Field(
        default=None,
        ge=0,
        description="Metres of uncertainty as the browser reported it. A 2000 m "
        "'pin' is a wifi guess and must not be presented as a location.",
    )

    @model_validator(mode="after")
    def _drop_half_a_pin(self) -> "ReportRequest":
        """One coordinate is not a location.

        Dropped rather than rejected with a 422: the pin is an optional extra, and
        failing the whole complaint over it would lose the citizen's text and photo
        for the sake of a field they did not have to fill in. The same rule is a
        CHECK constraint in the database, which is what actually guarantees it.
        """
        if self.latitude is None or self.longitude is None:
            self.latitude = None
            self.longitude = None
            self.accuracy_m = None
        return self


class ReportResponse(BaseModel):
    """The stored report, returned to the browser and rendered by ResultCard."""

    id: str
    created_at: str

    # input, as received
    media_url: Optional[str] = None
    media_type: Optional[MediaType] = None
    raw_text: Optional[str] = None
    transcript: Optional[str] = None

    # classifier
    issue_type: IssueType
    summary: str
    confidence: float = 0.0

    # validator agent
    status: ReportStatus = "pending"
    ai_overview: Optional[str] = None
    validity_confidence: float = 0.0
    rejection_reason: Optional[str] = None
    evidence_quality: EvidenceQuality = "weak"

    # location, as received
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy_m: Optional[float] = None

    # router
    area_tag: Optional[str] = None
    authority_slug: str
    authority_assigned: str
    authority_email: Optional[str] = None
    routing_reason: Optional[str] = None

    # drafter
    complaint_text: str
    language: Language = "en"

    # feed / email bookkeeping
    upvotes: int = 0
    email_status: Optional[str] = None


class EmailResponse(BaseModel):
    report_id: str
    email_status: str  # 'sent' | 'failed' | 'skipped'
    detail: Optional[str] = None
