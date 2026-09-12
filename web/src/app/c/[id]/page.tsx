import Link from "next/link";
import { notFound } from "next/navigation";

import VoteBox from "@/components/VoteBox";
import { areaLabel, ISSUE_META, timeAgo } from "@/lib/format";
import { getReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function ComplaintPage({ params }: PageProps<"/c/[id]">) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const meta = report.issue_type ? ISSUE_META[report.issue_type] : null;
  const isUrdu = report.language === "ur";
  const body = report.complaint_text || report.raw_text || report.transcript || "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Back to feed
      </Link>

      <article className="mt-3 flex gap-3 rounded-lg border border-line bg-surface p-4">
        <VoteBox reportId={report.id} upvotes={report.upvotes} />

        <div className="min-w-0 flex-1">
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

          <h1
            className={`mt-2 text-xl font-semibold leading-snug ${isUrdu ? "urdu" : ""}`}
            dir={isUrdu ? "rtl" : "ltr"}
          >
            {report.summary || report.raw_text || "Untitled report"}
          </h1>

          {report.media_url && report.media_type === "photo" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.media_url}
              alt=""
              className="mt-3 max-h-[420px] w-full rounded-lg border border-line object-cover"
            />
          )}
          {report.media_url && report.media_type === "audio" && (
            <audio controls src={report.media_url} className="mt-3 w-full" />
          )}

          <div className="mt-4 rounded-lg bg-surface-2 p-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted">Routed to</p>
            <p className="mt-1 font-semibold">{report.authority_assigned || "Not yet routed"}</p>
          </div>

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

          {body && (
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-muted">Complaint letter</p>
              <pre
                dir={isUrdu ? "rtl" : "ltr"}
                className={`overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-background p-4 text-sm ${
                  isUrdu ? "urdu text-right" : "font-sans"
                }`}
              >
                {body}
              </pre>
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
