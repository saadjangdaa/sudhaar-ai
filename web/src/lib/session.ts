/**
 * Anonymous session id, used only to stop obvious double-voting.
 *
 * Deliberately not Supabase auth: there is no login anywhere in the citizen flow,
 * and a localStorage id is the smallest thing that makes upvote_report idempotent.
 */
const KEY = "sudhaar_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // private window, or site data blocked: fall back to a per-tab id
    return "ephemeral-" + Math.random().toString(36).slice(2);
  }
}
