/**
 * Sample citizen login. Demo only — there is no server-side identity here.
 *
 * A display name in localStorage next to the existing anonymous session id. It
 * exists so the UI can show a signed-in state; the upvote RPC still keys off
 * getSessionId(), so nothing about voting depends on this.
 */
"use client";

const KEY = "sudhaar_user";

export interface CitizenUser {
  name: string;
  area: string;
}

export function getUser(): CitizenUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CitizenUser) : null;
  } catch {
    return null;
  }
}

export function setUser(user: CitizenUser): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(user));
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
