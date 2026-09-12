/**
 * Sample citizen login. Demo only — there is no server-side identity here.
 *
 * Name, area and CNIC in localStorage next to the existing anonymous session id.
 * It exists so the UI can show a signed-in state; the upvote RPC still keys off
 * getSessionId(), so nothing about voting depends on this.
 *
 * ---------------------------------------------------------------------------
 * The CNIC never leaves this device.
 *
 * public.reports is readable by anyone holding the anon key — that is what makes
 * the feed work. Putting a national ID number on those rows would publish the
 * identity documents of every person who reports a pothole, to anyone who opens
 * devtools. So the CNIC is stored here, is never sent to /api/report, and is
 * never written to Postgres.
 *
 * When real identity verification is needed, it belongs behind Supabase Auth in a
 * table with RLS scoped to the owning user — not on the public reports table, and
 * not in localStorage either. This is a hackathon stand-in for that.
 * ---------------------------------------------------------------------------
 */
"use client";

const KEY = "sudhaar_user";

export interface CitizenUser {
  name: string;
  area: string;
  /** 13 digits, no dashes. Device-local only — see the note above. */
  cnic: string;
}

/** Pakistani CNIC: 13 digits, conventionally written 00000-0000000-0. */
export function normalizeCnic(input: string): string {
  return input.replace(/\D/g, "").slice(0, 13);
}

export function isValidCnic(input: string): boolean {
  return normalizeCnic(input).length === 13;
}

/** Types as 42101-1234567-8 while the user fills the field. */
export function formatCnic(input: string): string {
  const d = normalizeCnic(input);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/**
 * What is safe to show on screen: last two digits only.
 * Never render a full CNIC in the UI — a shoulder-surfed screenshot is enough to
 * impersonate someone against a Pakistani call centre.
 */
export function maskCnic(input: string): string {
  const d = normalizeCnic(input);
  if (d.length !== 13) return "";
  return `*****-*****${d.slice(10, 12)}-*`;
}

export function getUser(): CitizenUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CitizenUser>;
    return {
      name: parsed.name ?? "Karachi resident",
      area: parsed.area ?? "",
      // Accounts created before the CNIC field existed have none. Tolerate that
      // rather than logging the user out.
      cnic: normalizeCnic(parsed.cnic ?? ""),
    };
  } catch {
    return null;
  }
}

export function setUser(user: CitizenUser): void {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...user, cnic: normalizeCnic(user.cnic) }),
    );
    window.dispatchEvent(new Event("sudhaar-auth"));
  } catch {
    // storage blocked; the session stays anonymous
  }
}

export function clearUser(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("sudhaar-auth"));
  } catch {
    // nothing to clear
  }
}
