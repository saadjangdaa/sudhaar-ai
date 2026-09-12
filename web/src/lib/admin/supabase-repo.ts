/**
 * Live mapping onto the tables in supabase/schema.sql.
 *
 * reports.authority_slug  →  authorities.slug   (not a uuid FK yet)
 * reports.media_url       →  Report.mediaUrl     (citizen photo in report-media)
 * reports.summary/raw_text/area_tag → Report.address (no address column)
 * reports.status          →  Report.status       (added; default 'pending')
 * authority_admins        →  auth.users.user_metadata until that table exists
 * authorities.auth_user_id is set on approve as the schema's 1:1 login hook
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { AREA_LABELS } from "@/lib/types";
import type { ReportsRepository } from "./data-source";
import { readAdminMetadata } from "./session";
import { createAdminServerClient } from "./supabase";
import type { Authority, AuthorityAdmin, Report, ReportStatus, StatusChangeRecord } from "./types";

type AuthorityRow = {
  id: string;
  slug: string;
  name: string;
  acronym: string | null;
  email: string | null;
  auth_user_id: string | null;
};

type ReportRow = {
  id: string;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
  raw_text: string | null;
  transcript: string | null;
  issue_type: string | null;
  summary: string | null;
  area_tag: string | null;
  authority_slug: string | null;
  authority_assigned: string | null;
  complaint_text: string | null;
  status?: string | null;
};

function service() {
  return createAdminClient();
}

function parseStatus(value: unknown): ReportStatus {
  if (value === "in_progress" || value === "fixed" || value === "pending") return value;
  return "pending";
}

function isPhotoUrl(url: string | null, mediaType: string | null): url is string {
  if (!url) return false;
  if (mediaType === "audio") return false;
  if (mediaType === "photo") return true;
  return !/\.(mp3|m4a|wav|ogg|webm)(\?|$)/i.test(url);
}

function mapAuthority(row: AuthorityRow, areaTags: string[] = []): Authority {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    contactEmail: row.email ?? undefined,
    areaTags,
    issueTypesHandled: [],
  };
}

function mapReport(row: ReportRow, authorityId: string): Report {
  const areaTag = row.area_tag ?? "";
  const title =
    row.summary ||
    (areaTag ? (AREA_LABELS[areaTag] ?? areaTag) : "") ||
    row.raw_text ||
    "Untagged complaint";

  return {
    id: row.id,
    createdAt: row.created_at,
    mediaUrl: isPhotoUrl(row.media_url, row.media_type) ? row.media_url : "",
    address: title,
    areaTag,
    issueType: row.issue_type ?? "unknown",
    authorityId,
    status: parseStatus(row.status),
    complaintText: row.raw_text || row.transcript || undefined,
  };
}

async function loadAuthority(idOrUser: { id?: string; userId?: string }): Promise<AuthorityRow | null> {
  const db = service();
  if (idOrUser.id) {
    const { data, error } = await db.from("authorities").select("*").eq("id", idOrUser.id).maybeSingle();
    if (error) throw new Error(`Could not load authority: ${error.message}`);
    return (data as AuthorityRow | null) ?? null;
  }
  if (idOrUser.userId) {
    const { data, error } = await db
      .from("authorities")
      .select("*")
      .eq("auth_user_id", idOrUser.userId)
      .maybeSingle();
    if (error) throw new Error(`Could not load authority: ${error.message}`);
    return (data as AuthorityRow | null) ?? null;
  }
  return null;
}

async function areaTagsForSlug(slug: string): Promise<string[]> {
  const { data, error } = await service()
    .from("reports")
    .select("area_tag")
    .eq("authority_slug", slug)
    .not("area_tag", "is", null);
  if (error) return [];
  return [...new Set((data ?? []).map((row) => row.area_tag as string).filter(Boolean))];
}

async function metadataFor(userId: string) {
  try {
    const { data, error } = await service().auth.admin.getUserById(userId);
    if (!error && data.user) return readAdminMetadata(data.user.user_metadata);
  } catch {
    // fall through to the cookie session
  }
  try {
    const supabase = await createAdminServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.id === userId) return readAdminMetadata(data.user.user_metadata);
  } catch {
    return null;
  }
  return null;
}

export async function listDbAuthorities(): Promise<Authority[]> {
  const { data, error } = await service().from("authorities").select("*").order("name");
  if (error) throw new Error(`Could not load authorities: ${error.message}`);
  return ((data ?? []) as AuthorityRow[]).map((row) => mapAuthority(row));
}

export class SupabaseReportsRepository implements ReportsRepository {
  async getMyAuthority(userId: string): Promise<Authority | null> {
    const meta = await metadataFor(userId);
    const row =
      (meta?.approvalStatus === "approved" && meta.authorityId
        ? await loadAuthority({ id: meta.authorityId })
        : null) ?? (await loadAuthority({ userId }));
    if (!row) return null;
    return mapAuthority(row, await areaTagsForSlug(row.slug));
  }

  async getReportsForAuthority(authorityId: string, status?: ReportStatus): Promise<Report[]> {
    const authority = await loadAuthority({ id: authorityId });
    if (!authority) return [];

    let query = service()
      .from("reports")
      .select("*")
      .eq("authority_slug", authority.slug)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      // Column missing: return unfiltered rows and sort in memory as pending.
      if (status && /column .*status/i.test(error.message)) {
        const fallback = await service()
          .from("reports")
          .select("*")
          .eq("authority_slug", authority.slug)
          .order("created_at", { ascending: false });
        if (fallback.error) throw new Error(`Could not load reports: ${fallback.error.message}`);
        return ((fallback.data ?? []) as ReportRow[])
          .map((row) => mapReport(row, authority.id))
          .filter((report) => report.status === status);
      }
      throw new Error(`Could not load reports: ${error.message}`);
    }

    return ((data ?? []) as ReportRow[]).map((row) => mapReport(row, authority.id));
  }

  async updateReportStatus(record: StatusChangeRecord): Promise<Report> {
    if (record.newStatus === "fixed") {
      if (!record.proofMediaUrl || record.aiVerified !== true) {
        throw new Error("fixed status requires proofMediaUrl + aiVerified === true before persisting.");
      }
    }

    const db = service();
    const { data: existing, error: readError } = await db
      .from("reports")
      .select("*")
      .eq("id", record.reportId)
      .maybeSingle();
    if (readError) throw new Error(`Could not load report: ${readError.message}`);
    if (!existing) throw new Error(`Report ${record.reportId} was not found.`);

    const current = parseStatus((existing as ReportRow).status);
    if (current !== record.oldStatus) {
      throw new Error(`Report ${record.reportId} is ${current}, not ${record.oldStatus}.`);
    }

    const { data: updated, error } = await db
      .from("reports")
      .update({ status: record.newStatus })
      .eq("id", record.reportId)
      .select("*")
      .single();

    if (error) {
      if (/column .*status/i.test(error.message)) {
        throw new Error(
          "reports.status is missing. Run the status alter at the bottom of supabase/schema.sql.",
        );
      }
      throw new Error(`Could not update status: ${error.message}`);
    }

    const slug = (updated as ReportRow).authority_slug;
    const authority = slug
      ? ((await db.from("authorities").select("id").eq("slug", slug).maybeSingle()).data as { id: string } | null)
      : null;

    return mapReport(updated as ReportRow, authority?.id ?? record.reportId);
  }

  async getPendingAdmins(): Promise<AuthorityAdmin[]> {
    const { data, error } = await service().auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(`Could not list pending admins: ${error.message}`);

    return (data.users ?? [])
      .map((user) => {
        const meta = readAdminMetadata(user.user_metadata);
        return {
          id: user.id,
          authorityId: meta.authorityId ?? "",
          fullName: meta.fullName ?? user.email ?? "Unnamed admin",
          designation: meta.designation,
          approvalStatus: meta.approvalStatus,
        } satisfies AuthorityAdmin;
      })
      .filter((admin) => admin.approvalStatus === "pending");
  }

  async setAdminApproval(
    adminId: string,
    status: "approved" | "rejected",
    authorityId?: string,
  ): Promise<void> {
    const db = service();
    const { data, error } = await db.auth.admin.getUserById(adminId);
    if (error || !data.user) {
      throw new Error(error?.message ?? "User was not found.");
    }

    const meta = readAdminMetadata(data.user.user_metadata);
    const nextAuthorityId = status === "approved" ? (authorityId ?? meta.authorityId) : null;
    if (status === "approved" && !nextAuthorityId) {
      throw new Error("Assign an authority before approving.");
    }

    const { error: updateError } = await db.auth.admin.updateUserById(adminId, {
      user_metadata: {
        ...data.user.user_metadata,
        approvalStatus: status,
        authorityId: nextAuthorityId,
      },
    });
    if (updateError) throw new Error(updateError.message);

    if (status === "approved" && nextAuthorityId) {
      const { error: linkError } = await db
        .from("authorities")
        .update({ auth_user_id: adminId })
        .eq("id", nextAuthorityId);
      if (linkError) throw new Error(`Could not link authority login: ${linkError.message}`);
    }

    if (status === "rejected") {
      await db.from("authorities").update({ auth_user_id: null }).eq("auth_user_id", adminId);
    }
  }
}
