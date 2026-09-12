"""
Auto-email step: sends a drafted complaint to the responsible authority over
Gmail SMTP using an app password.

Two guardrails, both on by default:

  ENABLE_EMAIL=false      nothing sends at all until it is flipped
  EMAIL_OVERRIDE_TO=...   every message goes to that address instead of the
                          authority's. The seeded authority emails are invented
                          placeholders, and a hackathon build must not fire
                          complaint mail into real KMC/KWSB inboxes.
"""

import logging
from email.message import EmailMessage

import aiosmtplib

from app import db
from app.config import settings

log = logging.getLogger(__name__)


def _build_message(report: dict, authority: dict, recipient: str) -> EmailMessage:
    issue = (report.get("issue_type") or "civic").title()
    area = report.get("area_tag") or "Karachi"

    msg = EmailMessage()
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_user}>"
    msg["To"] = recipient
    msg["Subject"] = f"{issue} complaint — {area} (ref {str(report['id'])[:8]})"

    body_parts = []

    # When the override is active, say so in the body. Otherwise a test mail is
    # indistinguishable from a real one.
    if settings.email_override_to:
        body_parts.append(
            f"[TEST MODE] Intended recipient: {authority.get('email') or 'unknown'}\n"
            f"Routed to: {authority.get('name')}\n"
            f"{'-' * 60}\n"
        )

    body_parts.append(report.get("complaint_text") or "(no complaint text)")

    if report.get("media_url"):
        body_parts.append(f"\n\nAttached evidence: {report['media_url']}")

    complaint_link = f"{settings.web_base_url.rstrip('/')}/c/{report['id']}"
    body_parts.append(
        f"\n\nView this complaint online: {complaint_link}"
        f"\n\nSubmitted via Sudhaar · report id {report['id']}"
    )

    # utf-8 so Urdu survives the wire
    msg.set_content("\n".join(body_parts), charset="utf-8")
    return msg


async def send_complaint_email(report: dict) -> tuple[str, str | None]:
    """Send one report to its assigned authority.

    Returns (email_status, detail) where status is 'sent' | 'failed' | 'skipped'.
    """
    if not settings.enable_email:
        db.set_email_status(report["id"], "skipped")
        return "skipped", "ENABLE_EMAIL is false"

    if not settings.smtp_user or not settings.smtp_app_password:
        db.set_email_status(report["id"], "skipped")
        return "skipped", "SMTP credentials are not configured"

    authority = db.get_authority_by_slug(report.get("authority_slug") or "")
    if not authority:
        db.set_email_status(report["id"], "failed")
        return "failed", f"no authority row for slug {report.get('authority_slug')!r}"

    recipient = settings.email_override_to or authority.get("email")
    if not recipient:
        db.set_email_status(report["id"], "failed")
        return "failed", "no recipient address available"

    try:
        await aiosmtplib.send(
            _build_message(report, authority, recipient),
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            start_tls=True,
            username=settings.smtp_user,
            password=settings.smtp_app_password,
            timeout=30,
        )
    except Exception as exc:
        # Render's free tier may block outbound SMTP. The UI's mailto: button is
        # the fallback, so a failure here is survivable.
        log.warning("SMTP send failed for report %s", report["id"], exc_info=True)
        db.set_email_status(report["id"], "failed")
        return "failed", str(exc)

    db.set_email_status(report["id"], "sent")

    # --- additive: notify the authority in-app ---------------------------------
    # A notification means "this authority was actually contacted". It must never
    # affect the email result, so every failure mode is swallowed here.
    try:
        db.create_notification_for_report(report, authority)
    except Exception:
        log.warning(
            "notification insert failed for report %s (email was still sent)",
            report["id"],
            exc_info=True,
        )
    # --------------------------------------------------------------------------

    return "sent", f"delivered to {recipient}"
