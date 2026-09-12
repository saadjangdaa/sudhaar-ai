import Link from "next/link";

import AiOverview from "@/components/AiOverview";
import VoteBox from "@/components/VoteBox";
import { areaLabel, ISSUE_META, STATUS_META, timeAgo } from "@/lib/format";
import type { ReportRow } from "@/lib/types";

/**
 * Single card component for every citizen report surface (feed + dashboard).
 *
 * Layout is identical on every instance:
 *   photo (or placeholder) → meta row → title → AI strip → authority → actions
 */
export default function ReportCard({
  report,
  commentCount = 0,
  variant = "full",
}: {
  report: ReportRow;
  commentCount?: number;
  variant?: "full" | "compact";
}) {
  const meta = report.issue_type ? ISSUE_META[report.issue_type] : null;
  const title = report.summary || report.raw_text || "Untitled report";
  const status = STATUS_META[report.status ?? "pending"];
  const hasPhoto = !!report.media_url && report.media_type === "photo";
  const photoHeight = variant === "compact" ? "h-36" : "aspect-video";

  return (
    <article className="interactive-card group overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card-resting)]">
      {/* Photo — always present; placeholder when none uploaded */}
      <Link href={`/c/${report.id}`} className={`relative block overflow-hidden ${photoHeight}`}>
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.media_url!}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-2 text-muted">
            <span className="text-3xl" aria-hidden>
              {meta?.icon ?? "📍"}
            </span>
            <span className="text-xs font-medium">No photo attached</span>
          </div>
        )}
      </Link>

      <div className={`px-4 ${variant === "compact" ? "pb-3 pt-2.5" : "pb-3 pt-3"}`}>
        {/* Meta: area · time · issue badge · status badge — always the same row */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted">
          <span className="font-semibold text-foreground/80">k/{areaLabel(report.area_tag)}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(report.created_at)}</span>
          {meta && (
            <span className={`rounded-md px-1.5 py-0.5 font-semibold ${meta.tone}`}>
              {meta.icon} {meta.label}
            </span>
          )}
          <span className={`rounded-md px-1.5 py-0.5 font-semibold ${status.tone}`}>
            {status.icon} {status.label}
          </span>
          {report.email_status === "sent" && (
            <span className="rounded-full bg-ok-weak px-2 py-0.5 font-semibold text-ok">✓ Sent</span>
          )}
        </div>

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

        {variant === "full" && <AiOverview report={report} compact />}

        <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-muted">
          <span aria-hidden>📮</span>
          <span className="truncate">{report.authority_assigned || "Unrouted"}</span>
        </p>

        {/* Action row — icon + labeled counts */}
        <div className="mt-3 flex items-center gap-2.5">
          <VoteBox reportId={report.id} upvotes={report.upvotes} layout="row" />

          <Link
            href={`/c/${report.id}#replies`}
            aria-label={`${commentCount} ${commentCount === 1 ? "reply" : "replies"}`}
            className="interactive-chip flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs text-muted hover:text-foreground"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
            </svg>
            <span className="font-semibold tabular-nums">{commentCount}</span>
            <span className="hidden sm:inline">{commentCount === 1 ? "reply" : "replies"}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
