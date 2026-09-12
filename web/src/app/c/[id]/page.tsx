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
    <main className="animate-page-enter mx-auto max-w-3xl px-4 py-6">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">
        ← Back to feed
      </Link>

      <article className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card-resting)]">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={report.media_url!} alt="" className="aspect-video w-full object-cover" />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-surface-2 text-muted">
            <span className="text-4xl" aria-hidden>
              {meta?.icon ?? "📍"}
            </span>
            <span className="text-sm font-medium">No photo attached</span>
          </div>
        )}

        <div className="flex gap-3 p-4">
          <VoteBox reportId={report.id} upvotes={report.upvotes} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span className="font-medium text-foreground">k/{areaLabel(report.area_tag)}</span>
              <span>·</span>
              <span>{timeAgo(report.created_at)}</span>
              {meta && (
                <span className={`rounded-md px-2 py-0.5 font-medium ${meta.tone}`}>
                  {meta.icon} {meta.label}
                </span>
              )}
              <span className={`rounded-md px-2 py-0.5 font-medium ${status.tone}`}>
                {status.icon} {status.label}
              </span>
              {!rejected && report.email_status === "sent" && (
                <span className="rounded-full bg-ok-weak px-2 py-0.5 font-medium text-ok">
                  ✓ Sent to authority
                </span>
              )}
            </div>

            <h1
              className={`mt-2 text-xl font-semibold leading-snug ${isUrdu ? "urdu" : ""}`}
              dir={isUrdu ? "rtl" : "ltr"}
            >
              {report.summary || report.raw_text || "Untitled report"}
            </h1>

            {report.media_url && report.media_type === "audio" && (
              <audio controls src={report.media_url} className="mt-3 w-full" />
            )}

            <AiOverview report={report} />

            {rejected ? (
              <div className="mt-4 rounded-2xl border border-line bg-surface-2 p-4 text-sm">
                <p className="font-semibold">This report is not published</p>
                <p className="mt-1 text-muted">
                  It did not pass automated review, so it does not appear on the public feed
                  and was not sent to any authority. Submit again with a clearer photo and a
                  short description of what is wrong.
                </p>
                <Link
                  href="/submit"
                  className="mt-3 inline-block rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
                >
                  Submit again
                </Link>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-surface-2 p-4 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted">Routed to</p>
                <p className="mt-1 font-semibold">{report.authority_assigned || "Not yet routed"}</p>
              </div>
            )}

            {report.raw_text && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-muted">Reported as</p>
                <p
                  className={`mt-1 text-sm ${isUrdu ? "urdu" : ""}`}
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
        <div id="replies">
          <CommentThread reportId={report.id} comments={comments} />
        </div>
      )}
    </main>
  );
}
