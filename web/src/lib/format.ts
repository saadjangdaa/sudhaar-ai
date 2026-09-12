import { AREA_LABELS, type IssueType, type ReportStatus } from "@/lib/types";

export const ISSUE_META: Record<IssueType, { label: string; icon: string; tone: string }> = {
  pothole: { label: "Pothole", icon: "🕳️", tone: "bg-violet-500/15 text-violet-400" },
  sewage: { label: "Sewage", icon: "🚱", tone: "bg-lime-600/15 text-lime-700 dark:text-lime-300" },
  garbage: { label: "Garbage", icon: "🗑️", tone: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300" },
  encroachment: { label: "Encroachment", icon: "🚧", tone: "bg-fuchsia-600/15 text-fuchsia-700 dark:text-fuchsia-300" },
  water: { label: "Water", icon: "💧", tone: "bg-sky-600/15 text-sky-700 dark:text-sky-300" },
};

/**
 * Status chips. The colours come from the tokens in globals.css, which the
 * authority desk also maps onto, so a "pending" chip looks identical in both.
 */
export const STATUS_META: Record<
  ReportStatus,
  { label: string; icon: string; tone: string }
> = {
  pending: {
    label: "Pending",
    icon: "⏳",
    tone: "bg-warn-weak text-warn",
  },
  in_progress: {
    label: "In progress",
    icon: "🔧",
    tone: "bg-info-weak text-info",
  },
  fixed: {
    label: "Fixed",
    icon: "✅",
    tone: "bg-ok-weak text-ok",
  },
  rejected: {
    label: "Rejected",
    icon: "⛔",
    tone: "bg-danger-weak text-danger",
  },
};

/** How much the validator agent's confidence should be trusted, in words. */
export function confidenceLabel(value?: number | null): string {
  if (value === null || value === undefined || value <= 0) return "not scored";
  if (value >= 0.85) return "high confidence";
  if (value >= 0.6) return "moderate confidence";
  return "low confidence";
}

export function areaLabel(area?: string | null): string {
  if (!area) return "Karachi";
  return AREA_LABELS[area] ?? area;
}

/** Migration backfill text — not a real AI verdict; render as muted, not a summary. */
export function isPlaceholderAiOverview(text?: string | null): boolean {
  if (!text?.trim()) return true;
  return /submitted before automated review|not ai-reviewed/i.test(text);
}

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}
