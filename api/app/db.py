"""
Supabase access, service-role only.

The service-role key bypasses RLS. That is deliberate: the browser never writes to
these tables, and `authorities` / `notifications` have RLS enabled with no
policies, so this is the only way in from the backend.
"""

import logging
from typing import Any, Optional

from supabase import Client, create_client

from app.config import settings

log = logging.getLogger(__name__)

_client: Optional[Client] = None


def db() -> Client:
    global _client
    if _client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set — see api/.env.example"
            )
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


# --------------------------------------------------------------------------
# reports
# --------------------------------------------------------------------------

def insert_report(row: dict[str, Any]) -> dict[str, Any]:
    result = db().table("reports").insert(row).execute()
    if not result.data:
        raise RuntimeError("report insert returned no row")
    return result.data[0]


def get_report(report_id: str) -> Optional[dict[str, Any]]:
    result = db().table("reports").select("*").eq("id", report_id).limit(1).execute()
    return result.data[0] if result.data else None


def set_email_status(report_id: str, status: str) -> None:
    db().table("reports").update({"email_status": status}).eq("id", report_id).execute()


# --------------------------------------------------------------------------
# authorities
# --------------------------------------------------------------------------

def get_authority_by_slug(slug: str) -> Optional[dict[str, Any]]:
    result = db().table("authorities").select("*").eq("slug", slug).limit(1).execute()
    return result.data[0] if result.data else None


# --------------------------------------------------------------------------
# notifications
#
# Written to by the mailer after a complaint email sends. Read by the
# /adminauthority portal — but that portal queries Postgres directly from
# Next.js server components, so the TS twin of the read helper below lives in
# web/src/lib/adminauthority/queries.ts. The duplication is intentional.
# --------------------------------------------------------------------------

def create_notification_for_report(
    report: dict[str, Any],
    authority: dict[str, Any],
) -> dict[str, Any]:
    """One row per authority that was actually emailed about a report."""
    area = report.get("area_tag") or "an unspecified area"
    issue = report.get("issue_type") or "civic"
    message = f"New {issue} complaint reported in {area}"

    result = (
        db()
        .table("notifications")
        .insert(
            {
                "authority_id": authority["id"],
                "report_id": report["id"],
                "message": message,
            }
        )
        .execute()
    )
    if not result.data:
        raise RuntimeError("notification insert returned no row")
    return result.data[0]


def get_notifications_for_authority(
    authority_id: str,
    unread_only: bool = True,
) -> list[dict[str, Any]]:
    """Query only — nothing calls this yet.

    It exists so the /adminauthority work has a known-good query to build on.
    No endpoint, no UI: see web/src/app/adminauthority/README.md.
    """
    query = db().table("notifications").select("*").eq("authority_id", authority_id)
    if unread_only:
        query = query.eq("is_read", False)
    return query.order("created_at", desc=True).execute().data or []
