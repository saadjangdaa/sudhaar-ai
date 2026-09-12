/**
 * Notification reads for the authority desk. SERVER COMPONENTS ONLY.
 *
 * The TS twin of get_notifications_for_authority in api/app/db.py. The desk talks
 * to Postgres directly rather than through FastAPI, so the query lives in both
 * places on purpose.
 *
 * A notifications row means "this authority was actually emailed about this
 * report", written by api/app/mailer.py after a successful SMTP send. The desk
 * does not surface these yet; the queries are here and working for when it does.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthorityRow, NotificationRow } from "@/lib/types";

/** Unread notifications for one authority, newest first. */
export async function getNotificationsForAuthority(
  authorityId: string,
  unreadOnly = true,
): Promise<NotificationRow[]> {
  let query = createAdminClient()
    .from("notifications")
    .select("*")
    .eq("authority_id", authorityId);

  if (unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load notifications: ${error.message}`);

  return (data ?? []) as NotificationRow[];
}

/**
 * Every notification, across all authorities.
 *
 * Unscoped, so it is for the super-admin view only — never for a desk signed in
 * as one authority. Use getNotificationsForAuthority for that.
 */
export async function getAllNotifications(limit = 50): Promise<NotificationRow[]> {
  const { data, error } = await createAdminClient()
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Could not load notifications: ${error.message}`);
  return (data ?? []) as NotificationRow[];
}

export async function getAuthorities(): Promise<AuthorityRow[]> {
  const { data, error } = await createAdminClient()
    .from("authorities")
    .select("*")
    .order("name");

  if (error) throw new Error(`Could not load authorities: ${error.message}`);
  return (data ?? []) as AuthorityRow[];
}
