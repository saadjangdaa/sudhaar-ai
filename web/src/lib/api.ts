/** Calls the FastAPI backend. The browser talks to it directly, so CORS matters. */
import type { ReportRequest, ReportResponse } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function submitReport(payload: ReportRequest): Promise<ReportResponse> {
  const res = await fetch(`${BASE}/api/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Report failed (${res.status}): ${detail}`);
  }

  return res.json();
}

export async function emailReport(reportId: string) {
  const res = await fetch(`${BASE}/api/report/${reportId}/email`, { method: "POST" });
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
    await fetch(`${BASE}/health`, { cache: "no-store" });
  } catch {
    // best effort only
  }
}
