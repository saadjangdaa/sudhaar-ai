/**
 * Server-side reads of public.reports via the anon key (RLS allows select only).
 *
 * Every read falls back to DEMO_REPORTS. Before credentials exist the app is
 * still browsable, and a database outage during the demo shows a populated feed
 * rather than a blank one.
 */
import { DEMO_REPORTS } from "@/lib/demo";
import { createServerClient } from "@/lib/supabase/server";
import type { ReportRow } from "@/lib/types";

export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export type SortKey = "top" | "new";

export interface FeedFilters {
  sort?: SortKey;
  area?: string;
  authority?: string;
  issue_type?: string;
}

function filterDemo(rows: ReportRow[], filters: FeedFilters): ReportRow[] {
  // Same rule as the live query below, so demo mode and live mode agree.
  let out = rows.filter((r) => r.status !== "rejected");
  if (filters.area) out = out.filter((r) => r.area_tag === filters.area);
  if (filters.authority) out = out.filter((r) => r.authority_slug === filters.authority);
  if (filters.issue_type) out = out.filter((r) => r.issue_type === filters.issue_type);

  return [...out].sort((a, b) =>
    filters.sort === "new"
      ? Date.parse(b.created_at) - Date.parse(a.created_at)
      : b.upvotes - a.upvotes || Date.parse(b.created_at) - Date.parse(a.created_at),
  );
}

export async function getReports(filters: FeedFilters = {}): Promise<ReportRow[]> {
  if (!SUPABASE_CONFIGURED) return filterDemo(DEMO_REPORTS, filters);

  try {
    let query = createServerClient()
      .from("reports")
      .select("*")
      // The validator agent rejected these as fake. They must never be public.
      .neq("status", "rejected")
      .limit(100);

    if (filters.area) query = query.eq("area_tag", filters.area);
    if (filters.authority) query = query.eq("authority_slug", filters.authority);
    if (filters.issue_type) query = query.eq("issue_type", filters.issue_type);

    query =
      filters.sort === "new"
        ? query.order("created_at", { ascending: false })
        : query.order("upvotes", { ascending: false }).order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data as ReportRow[]) ?? [];
  } catch {
    return filterDemo(DEMO_REPORTS, filters);
  }
}

/**
 * One report by id, rejected ones included.
 *
 * The feed excludes rejected reports; this does not, so the citizen who submitted
 * one can still open their own link and read why it was turned down. The detail
 * page renders that as a rejection notice instead of a complaint — see
 * web/src/app/c/[id]/page.tsx.
 */
export async function getReport(id: string): Promise<ReportRow | null> {
  if (!SUPABASE_CONFIGURED) return DEMO_REPORTS.find((r) => r.id === id) ?? null;

  try {
    const { data, error } = await createServerClient()
      .from("reports")
      .select("*")
      .eq("id", id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as ReportRow | null) ?? DEMO_REPORTS.find((r) => r.id === id) ?? null;
  } catch {
    return DEMO_REPORTS.find((r) => r.id === id) ?? null;
  }
}
