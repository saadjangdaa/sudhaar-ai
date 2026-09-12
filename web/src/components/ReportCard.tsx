import Link from "next/link";

import VoteBox from "@/components/VoteBox";
import { areaLabel, ISSUE_META, timeAgo } from "@/lib/format";
import type { ReportRow } from "@/lib/types";

export default function ReportCard({ report }: { report: ReportRow }) {
  const meta = report.issue_type ? ISSUE_META[report.issue_type] : null;
  const title = report.summary || report.raw_text || "Untitled report";

  return (
    <article className="flex gap-2 rounded-lg border border-line bg-surface p-2 transition hover:border-muted/40">
      <VoteBox reportId={report.id} upvotes={report.upvotes} />

      <div className="min-w-0 flex-1 py-1 pr-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="font-medium text-foreground">k/{areaLabel(report.area_tag)}</span>
          <span>·</span>
          <span>{timeAgo(report.created_at)}</span>
          {meta && (
            <span className={`rounded-full px-2 py-0.5 font-medium ${meta.tone}`}>
              {meta.icon} {meta.label}
            </span>
          )}
          {report.email_status === "sent" && (
            <span className="rounded-full bg-emerald-600/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
              ✓ Sent to authority
            </span>
          )}
        </div>

        <Link href={`/c/${report.id}`} className="mt-1 block">
          <h2
            className={`text-[15px] font-semibold leading-snug hover:text-brand ${
              report.language === "ur" ? "urdu" : ""
            }`}
            dir={report.language === "ur" ? "rtl" : "ltr"}
          >
            {title}
          </h2>
        </Link>

        {report.media_url && report.media_type === "photo" && (
          <div className="mt-2 h-44 w-full overflow-hidden rounded-md bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={report.media_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="truncate">📮 {report.authority_assigned || "Unrouted"}</span>
          <Link href={`/c/${report.id}`} className="hover:text-foreground">
            💬 View complaint
          </Link>
        </div>
      </div>
    </article>
  );
}
