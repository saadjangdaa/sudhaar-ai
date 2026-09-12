/**
 * Mirrors ReportStatus in @/lib/types. "rejected" is set by the validator agent
 * at submission time and never by this desk — a rejected report is filtered out
 * of every query here, so the desk only ever sees the other three.
 */
export type ReportStatus = "pending" | "in_progress" | "fixed" | "rejected";

export interface Authority {
  id: string;
  name: string;
  areaTags: string[];
  issueTypesHandled: string[];
  contactEmail?: string;
  /** public.authorities.slug — used to match reports.authority_slug */
  slug?: string;
}

export interface AuthorityAdmin {
  id: string; // matches Supabase auth.users.id
  authorityId: string;
  fullName: string;
  designation?: string;
  approvalStatus: "pending" | "approved" | "rejected";
}

export interface Report {
  id: string;
  createdAt: string;
  mediaUrl: string;
  address: string;
  areaTag: string;
  issueType: string;
  authorityId: string;
  status: ReportStatus;
  complaintText?: string;
}

export interface StatusChangeRecord {
  reportId: string;
  oldStatus: ReportStatus;
  newStatus: ReportStatus;
  changedBy: string;
  proofMediaUrl?: string;
  aiVerified?: boolean;
  aiConfidence?: number;
}

/** Stored on auth.users.user_metadata until authority_admins exists. */
export type AdminUserMetadata = {
  authorityId: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  fullName?: string;
  designation?: string;
};
