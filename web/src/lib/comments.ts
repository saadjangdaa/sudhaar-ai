/**
 * Server-side reads of public.comments via the anon key (RLS allows select).
 *
 * Every read degrades to DEMO_COMMENTS or to an empty result rather than
 * throwing. A complaint whose thread fails to load should still render the
 * complaint — the thread is context, not the page.
 */
import { DEMO_COMMENTS } from "@/lib/demo";
import { SUPABASE_CONFIGURED } from "@/lib/reports";
import { createServerClient } from "@/lib/supabase/server";
import type { CommentRow } from "@/lib/types";

export async function getComments(reportId: string): Promise<CommentRow[]> {
  if (!SUPABASE_CONFIGURED) {
    return DEMO_COMMENTS.filter((c) => c.report_id === reportId);
  }

  try {
    const { data, error } = await createServerClient()
      .from("comments")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as CommentRow[];
  } catch {
    // Table missing (004 not applied yet) or the read failed. Fall back to the
    // demo thread for demo ids, and to silence for everything else.
    return DEMO_COMMENTS.filter((c) => c.report_id === reportId);
  }
}

/**
 * report_id -> comment count, for the feed.
 *
 * One grouped read rather than a count per card: the feed renders up to 100
 * reports and an N+1 there would be the slowest thing on the page. Failure
 * returns an empty map, so the feed simply shows no counts.
 */
export async function getCommentCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (!SUPABASE_CONFIGURED) {
    for (const c of DEMO_COMMENTS) {
      counts.set(c.report_id, (counts.get(c.report_id) ?? 0) + 1);
    }
    return counts;
  }

  try {
    const { data, error } = await createServerClient()
      .from("comments")
      .select("report_id")
      .limit(5000);
    if (error) throw error;
    for (const row of (data ?? []) as { report_id: string }[]) {
      counts.set(row.report_id, (counts.get(row.report_id) ?? 0) + 1);
    }
  } catch {
    // 004 not applied, or the read failed. No counts is a fine outcome.
  }

  return counts;
}
