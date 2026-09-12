import Link from "next/link";
import { notFound } from "next/navigation";

import AiOverview from "@/components/AiOverview";
import CommentThread from "@/components/CommentThread";
import ComplaintLetter from "@/components/ComplaintLetter";
import VoteBox from "@/components/VoteBox";
import { areaLabel, ISSUE_META, STATUS_META, timeAgo } from "@/lib/format";
import { getComments } from "@/lib/comments";
import { getReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function ComplaintPage({ params }: PageProps<"/c/[id]">) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const comments = report.status === "rejected" ? [] : await getComments(report.id);

  const meta = report.issue_type ? ISSUE_META[report.issue_type] : null;
  const status = STATUS_META[report.status ?? "pending"];
  const isUrdu = report.language === "ur";
  const rejected = report.status === "rejected";
  const body = rejected
    ? ""
    : report.complaint_text || report.raw_text || report.transcript || "";
  const hasPhoto = !!report.media_url && report.media_type === "photo";

  return (
    <div className="animate-page-enter page-column px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/" className="btn btn-ghost !px-0 text-sm">
        ← Feed
      </Link>

      <article className="feed-card mt-4">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={report.media_url!} alt="" className="aspect-[4/3] w-full object-cover sm:aspect-video" />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-[var(--surface-hover)] sm:aspect-video">
            <span className="text-4xl opacity-60" aria-hidden>
              {meta?.icon ?? "📍"}
            </span>
            <span className="font-mono text-xs uppercase tracking-wide text-muted">No photo</span>
          </div>
        )}

        <div className="flex gap-4 p-5 sm:p-6">
          <VoteBox reportId={report.id} upvotes={report.upvotes} />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="font-display text-xs font-bold text-brand">
                k/{areaLabel(report.area_tag)}
              </span>
              <span className="font-mono text-[11px] text-muted">{timeAgo(report.created_at)}</span>
              {meta && (
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
                  {meta.icon} {meta.label}
                </span>
              )}
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>
                {status.icon} {status.label}
              </span>
              {!rejected && report.email_status === "sent" && (
                <span className="rounded-md bg-ok-weak px-2 py-0.5 text-[11px] font-semibold text-ok">
                  Sent to authority
                </span>
              )}
            </div>

            <h1
              className={`font-display text-xl font-bold leading-snug tracking-tight sm:text-2xl ${
                isUrdu ? "urdu" : ""
              }`}
              dir={isUrdu ? "rtl" : "ltr"}
            >
              {report.summary || report.raw_text || "Untitled report"}
            </h1>

            {report.media_url && report.media_type === "audio" && (
              <audio controls src={report.media_url} className="w-full" />
            )}

            <AiOverview report={report} />

            {rejected ? (
              <div className="panel border-danger/30">
                <p className="font-display font-bold">Not published</p>
                <p className="mt-2 text-sm text-muted">
                  This report did not pass automated review. Submit again with a clearer photo
                  and description.
                </p>
                <Link href="/submit" className="btn btn-primary mt-4 inline-flex">
                  Submit again
                </Link>
              </div>
            ) : (
              <div className="panel !py-3">
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted">Routed to</p>
                <p className="font-display mt-1 font-bold">
                  {report.authority_assigned || "Not yet routed"}
                </p>
              </div>
            )}

            {report.raw_text && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted">
                  Reported as
                </p>
                <p
                  className={`mt-1.5 text-sm leading-relaxed ${isUrdu ? "urdu" : ""}`}
                  dir={isUrdu ? "rtl" : "ltr"}
                >
                  {report.raw_text}
                </p>
              </div>
            )}

            {body && <ComplaintLetter text={body} isUrdu={isUrdu} />}
          </div>
        </div>
      </article>

      {!rejected && (
        <div id="replies" className="mt-8">
          <CommentThread reportId={report.id} comments={comments} />
        </div>
      )}
    </div>
  );
}
