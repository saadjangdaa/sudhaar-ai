/** Calls the FastAPI backend. The browser talks to it directly, so CORS matters. */
import type { ReportRequest, ReportResponse } from "@/lib/types";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Resolves the API origin, and refuses to quietly point a deployed site at a
 * developer's laptop.
 *
 * NEXT_PUBLIC_* values are inlined at build time. When the variable is missing
 * from the hosting environment the old `|| "http://localhost:8000"` fallback was
 * baked straight into the production bundle, so every visitor's browser tried to
 * POST to its own machine. That is refused as mixed content and as a dead
 * connection, and `fetch` reports it as the bare string "Failed to fetch" — which
 * says nothing about the actual cause and cost real debugging time.
 *
 * Locally the fallback is still the right default. Anywhere else it is a
 * misconfiguration, so say precisely that instead.
 */
function apiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (typeof window !== "undefined" && !LOCAL_HOSTS.has(window.location.hostname)) {
    throw new Error(
      "This site has no backend URL configured. Set NEXT_PUBLIC_API_BASE_URL in " +
        "the hosting project's environment variables and redeploy — the value is " +
        "baked in at build time, so an existing deployment will not pick it up.",
    );
  }

  return "http://localhost:8000";
}

/** Turns a network-layer failure into something that names the host it could not reach. */
function unreachable(base: string, cause: unknown): Error {
  return new Error(
    `Could not reach the API at ${base}. It may be asleep, still starting up, or ` +
      `not allowing requests from this site.`,
    { cause },
  );
}

export async function submitReport(payload: ReportRequest): Promise<ReportResponse> {
  const base = apiBase();

  let res: Response;
  try {
    res = await fetch(`${base}/api/report`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (cause) {
    throw unreachable(base, cause);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Report failed (${res.status}): ${detail}`);
  }

  return res.json();
}

export async function emailReport(reportId: string) {
  const base = apiBase();

  let res: Response;
  try {
    res = await fetch(`${base}/api/report/${reportId}/email`, { method: "POST" });
  } catch (cause) {
    throw unreachable(base, cause);
  }

  if (!res.ok) throw new Error(`Email failed (${res.status})`);
  return res.json();
}

/**
 * Wakes the Render free-tier dyno, which sleeps after ~15 minutes idle and then
 * takes ~50s on the next request. Fire this on page load so the first real
 * submit is not the one that pays for it.
 */
export async function warmBackend(): Promise<void> {
  try {
    await fetch(`${apiBase()}/health`, { cache: "no-store" });
  } catch {
    // Best effort only — apiBase() can throw here too, and a cold start that
    // fails to warm is not worth surfacing.
  }
}
