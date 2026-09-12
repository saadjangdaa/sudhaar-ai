// FUTURE SCHEMA CONTRACT — when tables exist, real repo must return these shapes exactly.
//
// LIVE TABLES (supabase/schema.sql) — this is what SupabaseReportsRepository reads today:
//   reports.authority_slug  ↔  authorities.slug     (no reports.authority_id yet)
//   reports.media_url       ↔  Report.mediaUrl      (citizen upload in storage.report-media)
//   reports.summary|raw_text|area_tag ↔ Report.address (no address column)
//   reports.status          ↔  Report.status        (alter in schema.sql; default pending)
//   authority membership    ↔  auth.users.user_metadata + authorities.auth_user_id
//   reports.area_tag must match authorities.area_tags (array contains) — not on live table yet
//
// authorities
//   id                    uuid pk
//   name                  text
//   area_tags             text[]          ← reports.area_tag must match authorities.area_tags (array contains)
//   issue_types_handled   text[]
//   contact_email         text null
//
// authority_admins
//   id                    uuid pk         ← matches auth.users.id
//   authority_id          uuid fk authorities.id
//   full_name             text
//   designation           text null
//   approval_status       text            ← 'pending' | 'approved' | 'rejected'
//   Until this table exists, the same fields live on auth.users.user_metadata.
//   Swap metadata reads/writes in PreSchemaReportsRepository for table reads/writes.
//
// reports
//   id                    uuid pk
//   created_at            timestamptz
//   media_url             text            ← citizen-submitted "before" photo
//   address               text
//   area_tag              text            ← must be contained in authorities.area_tags
//   issue_type            text
//   authority_id          uuid fk
//   status                text            ← 'pending' | 'in_progress' | 'fixed'  (current value only)
//   complaint_text        text null
//
// report_status_history
//   id                    uuid pk
//   report_id             uuid fk
//   old_status            text
//   new_status            text
//   changed_by            uuid            ← auth.users.id
//   proof_media_url       text null
//   ai_verified           boolean null
//   ai_confidence         numeric null
//   created_at            timestamptz
//   Report status changes must be logged in this history table, not overwritten in place.
//   reports.status is a denormalized current-value column updated in the same transaction.
//
// "fixed" status requires proofMediaUrl + aiVerified === true before persisting.
// The UI must never write status='fixed' directly; only POST /api/admin/verify-fix
// after verifyFix() returns verified: true.
//
// Field mapping (TS camelCase → SQL snake_case):
//   areaTags            → area_tags
//   issueTypesHandled   → issue_types_handled
//   contactEmail        → contact_email
//   fullName            → full_name
//   approvalStatus      → approval_status
//   createdAt           → created_at
//   mediaUrl            → media_url
//   areaTag             → area_tag
//   issueType           → issue_type
//   authorityId         → authority_id
//   complaintText       → complaint_text
//   reportId            → report_id
//   oldStatus           → old_status
//   newStatus           → new_status
//   changedBy           → changed_by
//   proofMediaUrl       → proof_media_url
//   aiVerified          → ai_verified
//   aiConfidence        → ai_confidence

import { createAdminClient } from "@/lib/supabase/admin";
import type { ReportsRepository } from "./data-source";
import { readAdminMetadata } from "./session";
import { createAdminServerClient } from "./supabase";
import type { Authority, AuthorityAdmin, Report, ReportStatus, StatusChangeRecord } from "./types";

const AUTHORITIES: Authority[] = [
  {
    id: "kmc-central",
    name: "Karachi Metropolitan Corporation — District Central",
    areaTags: ["north_nazimabad", "gulberg", "liaquatabad"],
    issueTypesHandled: ["pothole", "garbage"],
    contactEmail: "central.desk@kmc.example.pk",
  },
  {
    id: "kwsc-south",
    name: "Karachi Water & Sewerage Corporation — South",
    areaTags: ["saddar", "clifton", "lyari"],
    issueTypesHandled: ["sewage", "water"],
    contactEmail: "south.ops@kwsc.example.pk",
  },
  {
    id: "dmc-east",
    name: "District Municipal Corporation East",
    areaTags: ["gulshan_e_iqbal", "malir", "shah_faisal"],
    issueTypesHandled: ["pothole", "garbage", "encroachment"],
    contactEmail: "complaints@dmc-east.example.pk",
  },
];

const SEED_REPORTS: Report[] = [
  {
    id: "rpt-01",
    createdAt: "2026-09-11T08:14:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc5782f?auto=format&fit=crop&w=1200&q=80",
    address: "Near Five Star Chowrangi, Block H, North Nazimabad",
    areaTag: "north_nazimabad",
    issueType: "pothole",
    authorityId: "kmc-central",
    status: "pending",
    complaintText: "Two-foot pothole on the bus lane. Cars swerve into the bike path after dark.",
  },
  {
    id: "rpt-02",
    createdAt: "2026-09-10T19:42:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=1200&q=80",
    address: "Hussainabad, Block 3, Liaquatabad",
    areaTag: "liaquatabad",
    issueType: "garbage",
    authorityId: "kmc-central",
    status: "in_progress",
    complaintText: "Skip overflowing since Eid. Stray dogs scattering bags onto the footpath.",
  },
  {
    id: "rpt-03",
    createdAt: "2026-09-08T11:05:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1465447142348-e9952c393450?auto=format&fit=crop&w=1200&q=80",
    address: "Tehzeeb Bakery stretch, Block 7, Gulberg",
    areaTag: "gulberg",
    issueType: "pothole",
    authorityId: "kmc-central",
    status: "fixed",
    complaintText: "Crater at the speed breaker in front of the bakery. Fixed after two visits.",
  },
  {
    id: "rpt-04",
    createdAt: "2026-09-12T07:20:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1618588507085-c72d3e5d2c0a?auto=format&fit=crop&w=1200&q=80",
    address: "KDA Chowk service road, North Nazimabad",
    areaTag: "north_nazimabad",
    issueType: "garbage",
    authorityId: "kmc-central",
    status: "pending",
    complaintText: "Burnt pile next to the nullah. Smoke into the flats every morning.",
  },
  {
    id: "rpt-05",
    createdAt: "2026-09-09T16:33:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
    address: "Water pump outside Juna Market, Saddar",
    areaTag: "saddar",
    issueType: "water",
    authorityId: "kwsc-south",
    status: "pending",
    complaintText: "Main line leaking since Friday. Road is a pond by Maghrib.",
  },
  {
    id: "rpt-06",
    createdAt: "2026-09-07T21:10:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80",
    address: "Cheel Chowk, Lyari",
    areaTag: "lyari",
    issueType: "sewage",
    authorityId: "kwsc-south",
    status: "in_progress",
    complaintText: "Manhole overflow into the lane. Kids walking through it to get to school.",
  },
  {
    id: "rpt-07",
    createdAt: "2026-09-06T13:48:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80",
    address: "Boat Basin, Block 5, Clifton",
    areaTag: "clifton",
    issueType: "sewage",
    authorityId: "kwsc-south",
    status: "fixed",
    complaintText: "Gutter backing up behind the food stalls. Crew cleared the blockage Tuesday.",
  },
  {
    id: "rpt-08",
    createdAt: "2026-09-11T18:02:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    address: "Abdullah Haroon Road, near Zainab Market, Saddar",
    areaTag: "saddar",
    issueType: "water",
    authorityId: "kwsc-south",
    status: "pending",
    complaintText: "No supply for 36 hours. Tanker mafia quoting 8,000 for a fill.",
  },
  {
    id: "rpt-09",
    createdAt: "2026-09-04T09:27:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
    address: "Disco Bakery, Block 13-D, Gulshan-e-Iqbal",
    areaTag: "gulshan_e_iqbal",
    issueType: "pothole",
    authorityId: "dmc-east",
    status: "in_progress",
    complaintText: "University Road slip lane is broken. Rickshaws bottom out at the dip.",
  },
  {
    id: "rpt-10",
    createdAt: "2026-09-05T15:55:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
    address: "Shahrah-e-Faisal, Nursery Flyover underside, Shah Faisal",
    areaTag: "shah_faisal",
    issueType: "encroachment",
    authorityId: "dmc-east",
    status: "pending",
    complaintText: "Welding shop built onto the footpath. Pedestrians forced onto the fast lane.",
  },
  {
    id: "rpt-11",
    createdAt: "2026-09-03T10:12:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=1200&q=80",
    address: "Malir Halt, near the railway crossing",
    areaTag: "malir",
    issueType: "garbage",
    authorityId: "dmc-east",
    status: "fixed",
    complaintText: "Open dump against the colony wall. Pickup ran yesterday; street is clear.",
  },
  {
    id: "rpt-12",
    createdAt: "2026-09-12T09:40:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    address: "Millenium Mall back road, Block 13-A, Gulshan-e-Iqbal",
    areaTag: "gulshan_e_iqbal",
    issueType: "encroachment",
    authorityId: "dmc-east",
    status: "pending",
    complaintText: "Container shop blocking the fire lane behind the mall.",
  },
  {
    id: "rpt-13",
    createdAt: "2026-09-01T12:00:00+05:00",
    mediaUrl:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80",
    address: "Burns Road food street, Saddar",
    areaTag: "saddar",
    issueType: "sewage",
    authorityId: "kwsc-south",
    status: "in_progress",
    complaintText: "Drain smell from the covered nala. Vendors say it started after the last rain.",
  },
];

const SEED_PENDING_ADMINS: AuthorityAdmin[] = [
  {
    id: "mock-pending-admin",
    authorityId: "",
    fullName: "Farhan Qureshi",
    designation: "Assistant Director, Operations",
    approvalStatus: "pending",
  },
];

export function listSeedAuthorities(): Authority[] {
  return AUTHORITIES.map((row) => ({ ...row, areaTags: [...row.areaTags], issueTypesHandled: [...row.issueTypesHandled] }));
}

export class MockReportsRepository implements ReportsRepository {
  private reports: Report[];
  private history: StatusChangeRecord[] = [];
  private pendingAdmins: AuthorityAdmin[];

  constructor() {
    this.reports = structuredClone(SEED_REPORTS);
    this.pendingAdmins = structuredClone(SEED_PENDING_ADMINS);
  }

  getAuthorityById(id: string): Authority | null {
    return AUTHORITIES.find((row) => row.id === id) ?? null;
  }

  async getMyAuthority(userId: string): Promise<Authority | null> {
    const assigned = this.pendingAdmins.find((admin) => admin.id === userId && admin.approvalStatus === "approved");
    if (!assigned?.authorityId) return null;
    return this.getAuthorityById(assigned.authorityId);
  }

  async getReportsForAuthority(authorityId: string, status?: ReportStatus): Promise<Report[]> {
    return this.reports
      .filter((report) => report.authorityId === authorityId && (!status || report.status === status))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateReportStatus(record: StatusChangeRecord): Promise<Report> {
    const report = this.reports.find((row) => row.id === record.reportId);
    if (!report) {
      throw new Error(`Report ${record.reportId} was not found.`);
    }
    if (report.status !== record.oldStatus) {
      throw new Error(`Report ${record.reportId} is ${report.status}, not ${record.oldStatus}.`);
    }
    if (record.newStatus === "fixed") {
      if (!record.proofMediaUrl || record.aiVerified !== true) {
        throw new Error("fixed status requires proofMediaUrl + aiVerified === true before persisting.");
      }
    }
    this.history.push({ ...record });
    report.status = record.newStatus;
    return { ...report };
  }

  async getPendingAdmins(): Promise<AuthorityAdmin[]> {
    return this.pendingAdmins.filter((admin) => admin.approvalStatus === "pending").map((admin) => ({ ...admin }));
  }

  async setAdminApproval(
    adminId: string,
    status: "approved" | "rejected",
    authorityId?: string,
  ): Promise<void> {
    const existing = this.pendingAdmins.find((admin) => admin.id === adminId);
    if (existing) {
      existing.approvalStatus = status;
      if (status === "approved" && authorityId) existing.authorityId = authorityId;
      return;
    }
    this.pendingAdmins.push({
      id: adminId,
      authorityId: authorityId ?? "",
      fullName: "Authority admin",
      approvalStatus: status,
    });
  }
}

function tryServiceClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

/**
 * Reports stay in the mock until tables exist. Pending-admin reads/writes go
 * through auth.users.user_metadata when the service-role key is present.
 */
export class PreSchemaReportsRepository implements ReportsRepository {
  constructor(private readonly mock: MockReportsRepository) {}

  async getMyAuthority(userId: string): Promise<Authority | null> {
    const service = tryServiceClient();
    if (service) {
      const { data, error } = await service.auth.admin.getUserById(userId);
      if (!error && data.user) {
        const meta = readAdminMetadata(data.user.user_metadata);
        if (meta.approvalStatus !== "approved" || !meta.authorityId) return null;
        return this.mock.getAuthorityById(meta.authorityId);
      }
    }

    try {
      const supabase = await createAdminServerClient();
      const { data } = await supabase.auth.getUser();
      if (data.user?.id === userId) {
        const meta = readAdminMetadata(data.user.user_metadata);
        if (meta.approvalStatus !== "approved" || !meta.authorityId) return null;
        return this.mock.getAuthorityById(meta.authorityId);
      }
    } catch {
      // No cookie session (or missing env). Fall through to the mock map.
    }

    return this.mock.getMyAuthority(userId);
  }

  getReportsForAuthority(authorityId: string, status?: ReportStatus) {
    return this.mock.getReportsForAuthority(authorityId, status);
  }

  updateReportStatus(record: StatusChangeRecord) {
    return this.mock.updateReportStatus(record);
  }

  async getPendingAdmins(): Promise<AuthorityAdmin[]> {
    const service = tryServiceClient();
    if (!service) return this.mock.getPendingAdmins();

    const { data, error } = await service.auth.admin.listUsers({ perPage: 1000 });
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
    const service = tryServiceClient();
    if (!service) {
      await this.mock.setAdminApproval(adminId, status, authorityId);
      return;
    }

    const { data, error } = await service.auth.admin.getUserById(adminId);
    if (error || !data.user) {
      throw new Error(error?.message ?? "User was not found.");
    }
    const meta = readAdminMetadata(data.user.user_metadata);
    const nextAuthorityId = status === "approved" ? (authorityId ?? meta.authorityId) : null;
    if (status === "approved" && !nextAuthorityId) {
      throw new Error("Assign an authority before approving.");
    }

    const { error: updateError } = await service.auth.admin.updateUserById(adminId, {
      user_metadata: {
        ...data.user.user_metadata,
        approvalStatus: status,
        authorityId: nextAuthorityId,
      },
    });
    if (updateError) throw new Error(updateError.message);
  }
}

export function createPreSchemaReportsRepository(): ReportsRepository {
  return new PreSchemaReportsRepository(new MockReportsRepository());
}
