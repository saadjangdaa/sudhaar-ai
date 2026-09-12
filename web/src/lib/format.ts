import { AREA_LABELS, type IssueType } from "@/lib/types";

export const ISSUE_META: Record<IssueType, { label: string; icon: string; tone: string }> = {
  pothole: { label: "Pothole", icon: "🕳️", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  sewage: { label: "Sewage", icon: "🚱", tone: "bg-lime-600/15 text-lime-700 dark:text-lime-300" },
  garbage: { label: "Garbage", icon: "🗑️", tone: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300" },
  encroachment: { label: "Encroachment", icon: "🚧", tone: "bg-fuchsia-600/15 text-fuchsia-700 dark:text-fuchsia-300" },
  water: { label: "Water", icon: "💧", tone: "bg-sky-600/15 text-sky-700 dark:text-sky-300" },
};

export function areaLabel(area?: string | null): string {
  if (!area) return "Karachi";
  return AREA_LABELS[area] ?? area;
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
