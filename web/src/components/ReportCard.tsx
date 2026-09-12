import Link from "next/link";

import AiOverview from "@/components/AiOverview";
import VoteBox from "@/components/VoteBox";
import { areaLabel, ISSUE_META, STATUS_META, timeAgo } from "@/lib/format";
import type { ReportRow } from "@/lib/types";

/**
 * `commentCount` is passed down from the feed's single grouped read rather than
 * fetched here — see getCommentCounts(). Undefined means the count is unknown
 * (Supabase unreachable, or 004 not applied), which reads differently from zero
 * and so falls back to the plain link.
 *
 * ── Card anatomy (mobile-first, Citizen / Reddit / Nextdoor patterns) ──
 *
 *  ┌──────────────────────────────────┐  ← rounded-2xl card
 *  │  [full-bleed photo, 16:9 crop]  │  ← aspect-video, only if media_url
 *  │          ↑ gradient scrim       │
 *  │  [●status pill] bottom-left     │  ← overlaid on photo w/ scrim
 *  ├──────────────────────────────────┤
 *  │  k/Area · 🕳️ Pothole · 2h ago  │  ← meta row, 11 px
 *  │  Complaint title (2 lines max)  │  ← 15 px semibold, line-clamp-2
 *  │  AI overview compact            │  ← unchanged component
 *  │  📮 KMC                        │  ← authority line, 11 px
 *  │  [▲ 42 ▼]   [💬 3]   [✓ Sent] │  ← action row, thumb zone
 *  └──────────────────────────────────┘
 */
export default function ReportCard({
  report,
  commentCount,
}: {
  report: ReportRow;
  commentCount?: number;
}) {
  const meta = report.issue_type ? ISSUE_META[report.issue_type] : null;
  const title = report.summary || report.raw_text || "Untitled report";
  // Rejected rows are filtered out upstream in getReports, so a card only ever
  // shows pending / in_progress / fixed. Defaulting to pending keeps a row from
  // before the status column existed from rendering an empty chip.
  const status = STATUS_META[report.status ?? "pending"];
  const hasPhoto = !!report.media_url && report.media_type === "photo";

  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card-resting)] transition-all duration-200 hover:-translate-y-0.5 hover:border-muted/40 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.985]">

      {/* ── Full-bleed photo with gradient scrim + status overlay ── */}
      {hasPhoto && (
        <Link href={`/c/${report.id}`} className="relative block aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.media_url!}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {/* Gradient scrim so overlay pill is always legible */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent"
          />
          {/* Status badge overlaid on photo (borrowed from Citizen app UX) */}
          <span className="absolute bottom-2.5 left-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {status.icon} {status.label}
          </span>
          {/* Issue-type badge, top-right */}
          {meta && (
            <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm ${meta.tone}`}>
              {meta.icon} {meta.label}
            </span>
          )}
        </Link>
      )}

      {/* ── Card body ── */}
      <div className="px-4 pb-3 pt-3">

        {/* Meta row: neighbourhood · issue type · time · status (if no photo) */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted">
          <span className="font-semibold text-foreground/80">k/{areaLabel(report.area_tag)}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(report.created_at)}</span>

          {/* Issue badge — only when no photo (already shown there) */}
          {meta && !hasPhoto && (
            <span className={`rounded-md px-1.5 py-0.5 font-semibold ${meta.tone}`}>
              {meta.icon} {meta.label}
            </span>
          )}

          {/* Status badge — only when no photo (already shown there) */}
          {!hasPhoto && (
            <span className={`rounded-md px-1.5 py-0.5 font-semibold ${status.tone}`}>
              {status.icon} {status.label}
            </span>
          )}

          {report.email_status === "sent" && (
            <span className="ml-auto rounded-full bg-ok-weak px-2 py-0.5 font-semibold text-ok">
              ✓ Sent
            </span>
          )}
        </div>

        {/* Title — 2-line clamp so the feed stays scannable */}
        <Link href={`/c/${report.id}`} className="mt-1.5 block">
          <h2
            className={`line-clamp-2 text-[15px] font-semibold leading-snug hover:text-brand ${
              report.language === "ur" ? "urdu" : ""
            }`}
            dir={report.language === "ur" ? "rtl" : "ltr"}
          >
            {title}
          </h2>
        </Link>

        {/* AI verdict compact strip */}
        <AiOverview report={report} compact />

        {/* Authority attribution line */}
        <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-muted">
          <span aria-hidden>📮</span>
          <span className="truncate">{report.authority_assigned || "Unrouted"}</span>
        </p>

        {/* ── Action row (thumb zone) ── */}
        <div className="mt-3 flex items-center gap-2.5">
          {/* Horizontal vote pill (Reddit mobile / HIG thumb-zone pattern) */}
          <VoteBox reportId={report.id} upvotes={report.upvotes} layout="row" />

          {/* Comment count / link */}
          <Link
            href={`/c/${report.id}`}
            className="flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs text-muted transition-colors hover:bg-muted/15 hover:text-foreground active:scale-95"
          >
            {/* Chat bubble icon (inline SVG — no extra import required) */}
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
            </svg>
            <span className="font-semibold tabular-nums">
              {commentCount !== undefined ? commentCount : "Reply"}
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
