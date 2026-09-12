/**
 * FROZEN API CONTRACT — mirrors api/app/schemas.py, documented in docs/CONTRACTS.md.
 *
 * Renaming a field here without renaming it in schemas.py breaks the app silently.
 * Announce the change and update all three places in the same commit.
 */

export type IssueType = "pothole" | "sewage" | "garbage" | "encroachment" | "water";
export type Language = "en" | "ur";
export type MediaType = "photo" | "audio";
/**
 * One lifecycle, two owners. The validator agent sets "rejected" or "pending";
 * the authority desk moves "pending" -> "in_progress" -> "fixed".
 * "rejected" rows are hidden from the public feed and from the authority desk.
 */
export type ReportStatus = "pending" | "in_progress" | "fixed" | "rejected";
export type EvidenceQuality = "strong" | "weak" | "none";

/** POST /api/report request body. At least one of raw_text / media_url required. */
export interface ReportRequest {
  raw_text?: string | null;
  media_url?: string | null;
  media_type?: MediaType | null;
  /** Free text, e.g. "near Hassan Square, gulshan". The router normalizes it. */
  area_input?: string | null;
  language: Language;
}

/** POST /api/report response. Also the shape ResultCard renders. */
export interface ReportResponse {
  id: string;
  created_at: string;

  media_url?: string | null;
  media_type?: MediaType | null;
  raw_text?: string | null;
  transcript?: string | null;

  issue_type: IssueType;
  summary: string;
  confidence: number;

  /** validator agent */
  status: ReportStatus;
  ai_overview?: string | null;
  validity_confidence: number;
  rejection_reason?: string | null;
  evidence_quality: EvidenceQuality;

  area_tag?: string | null;
  authority_slug: string;
  authority_assigned: string;
  authority_email?: string | null;
  routing_reason?: string | null;

  complaint_text: string;
  language: Language;

  upvotes: number;
  email_status?: string | null;
}

/** A row of public.reports, as read straight from Supabase by the feed. */
/** A citizen reply on a complaint. See supabase/migrations/004_comments.sql. */
export interface CommentRow {
  id: string;
  report_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface ReportRow {
  id: string;
  created_at: string;
  media_url: string | null;
  media_type: MediaType | null;
  raw_text: string | null;
  transcript: string | null;
  issue_type: IssueType | null;
  summary: string | null;
  status: ReportStatus | null;
  ai_overview: string | null;
  validity_confidence: number | null;
  rejection_reason: string | null;
  evidence_quality: EvidenceQuality | null;
  area_tag: string | null;
  authority_slug: string | null;
  authority_assigned: string | null;
  routing_reason: string | null;
  complaint_text: string | null;
  language: Language | null;
  upvotes: number;
  email_status: string | null;
}

export interface AuthorityRow {
  id: string;
  slug: string;
  name: string;
  acronym: string | null;
  email: string | null;
  phone: string | null;
  /** Links this authority to a Supabase auth account. Set by /admin approvals. */
  auth_user_id: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  authority_id: string;
  report_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Keys of AREA_INDEX in api/app/authorities.py. Keep the two lists in step. */
export const AREAS = [
  "saddar", "lyari", "gulshan_e_iqbal", "north_nazimabad", "liaquatabad",
  "new_karachi", "orangi", "site", "keamari", "korangi", "landhi",
  "shah_faisal", "gadap", "bin_qasim", "gulberg", "clifton", "dha",
  "malir", "faisal_cantt",
] as const;

export const AREA_LABELS: Record<string, string> = {
  saddar: "Saddar",
  lyari: "Lyari",
  gulshan_e_iqbal: "Gulshan-e-Iqbal",
  north_nazimabad: "North Nazimabad",
  liaquatabad: "Liaquatabad",
  new_karachi: "New Karachi",
  orangi: "Orangi Town",
  site: "S.I.T.E.",
  keamari: "Keamari",
  korangi: "Korangi",
  landhi: "Landhi",
  shah_faisal: "Shah Faisal",
  gadap: "Gadap",
  bin_qasim: "Bin Qasim",
  gulberg: "Gulberg",
  clifton: "Clifton",
  dha: "DHA",
  malir: "Malir",
  faisal_cantt: "Faisal Cantonment",
};
