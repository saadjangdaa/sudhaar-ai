import Link from "next/link";

import AiOverview from "@/components/AiOverview";
import VoteBox from "@/components/VoteBox";
import { areaLabel, ISSUE_META, STATUS_META, timeAgo } from "@/lib/format";
import type { ReportRow } from "@/lib/types";

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

  return (
    <article className="feed-card group">
      <Link
        href={`/c/${report.id}`}
        className={`relative block overflow-hidden ${variant === "compact" ? "h-44" : "aspect-[4/3] sm:aspect-video"}`}
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.media_url!}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--surface-hover)]">
            <span className="text-3xl opacity-60" aria-hidden>
              {meta?.icon ?? "📍"}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              No photo
            </span>
          </div>
        )}
      </Link>

      <div className="space-y-2.5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <Link
            href={`/c/${report.id}`}
            className="font-display text-xs font-bold tracking-wide text-brand hover:underline"
          >
            k/{areaLabel(report.area_tag)}
          </Link>
          <span className="font-mono text-[11px] text-muted">{timeAgo(report.created_at)}</span>
          {meta && (
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
              {meta.icon} {meta.label}
            </span>
          )}
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>
            {status.icon} {status.label}
          </span>
          {report.email_status === "sent" && (
            <span className="rounded-md bg-ok-weak px-2 py-0.5 text-[11px] font-semibold text-ok">
              Sent
            </span>
          )}
        </div>

        <Link href={`/c/${report.id}`} className="block">
          <h2
            className={`font-display line-clamp-2 text-[16px] font-bold leading-snug tracking-tight transition-colors group-hover:text-brand sm:text-[17px] ${
              report.language === "ur" ? "urdu" : ""
            }`}
            dir={report.language === "ur" ? "rtl" : "ltr"}
          >
            {title}
          </h2>
        </Link>

        {variant === "full" && <AiOverview report={report} compact />}

        <p className="truncate font-mono text-[11px] text-muted">
          → {report.authority_assigned || "Unrouted"}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <VoteBox reportId={report.id} upvotes={report.upvotes} layout="row" />

          <Link
            href={`/c/${report.id}#replies`}
            aria-label={`${commentCount} replies`}
            className="pill gap-1.5 !py-2 font-mono text-xs tabular-nums"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden>
              <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
            </svg>
            {commentCount}
          </Link>
        </div>
      </div>
    </article>
  );
}
