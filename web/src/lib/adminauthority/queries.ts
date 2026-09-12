/**
 * Data access for the /adminauthority portal. SERVER COMPONENTS ONLY.
 *
 * TODO: build by [teammate] — this is the starting point, not the finished thing.
 *
 * The TS twin of get_notifications_for_authority in api/app/db.py. The portal
 * talks to Postgres directly rather than through FastAPI, so the query lives in
 * both places on purpose.
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
 * Only useful until login exists. There is no session yet, so the portal cannot
 * know WHICH authority is looking — see the README in this route folder.
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
