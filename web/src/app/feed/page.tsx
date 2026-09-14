import Link from "next/link";

import FeedSortBar from "@/components/FeedSortBar";
import ReportCard from "@/components/ReportCard";
import { getCommentCounts } from "@/lib/comments";
import { getReports, SUPABASE_CONFIGURED, type SortKey } from "@/lib/reports";

export const dynamic = "force-dynamic";

export const metadata = { title: "Feed — Sudhaar" };

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const params = await searchParams;
  const sort = (params.sort === "new" ? "new" : "top") as SortKey;
  const issueType = typeof params.issue_type === "string" ? params.issue_type : undefined;

  const [reports, commentCounts] = await Promise.all([
    getReports({ sort, issue_type: issueType }),
    getCommentCounts(),
  ]);

  return (
    <div className="animate-page-enter">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[1fr_18rem] lg:gap-10 lg:py-8">
        <div className="feed-column lg:max-w-none">
          <header className="mb-1">
            <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
              Karachi · Civic forum
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Neighbourhood feed
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              See what your area is reporting. Upvote to signal urgency.
            </p>
          </header>

          {!SUPABASE_CONFIGURED && (
            <p className="panel mb-4 border-dashed text-sm text-muted">
              Sample data — add Supabase env vars to{" "}
              <code className="font-mono text-xs">web/.env.local</code> for live reports.
            </p>
          )}

          <FeedSortBar sort={sort} issueType={issueType} />

          <div className="mt-2 space-y-4 sm:space-y-5">
            {reports.length === 0 ? (
              <div className="panel py-16 text-center">
                <p className="font-display text-lg font-semibold">Nothing here yet</p>
                <p className="mt-2 text-sm text-muted">
                  Be the first to report an issue in your area.
                </p>
                <Link href="/submit" className="btn btn-primary mt-6 inline-flex">
                  Report an issue
                </Link>
              </div>
            ) : (
              reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  commentCount={commentCounts.get(report.id) ?? 0}
                />
              ))
            )}
          </div>
        </div>

        <aside className="hidden space-y-4 lg:block">
          <div className="panel sticky top-24">
            <h2 className="font-display font-bold">About Sudhaar</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Report civic issues in Karachi with a photo or a few words. AI classifies,
              routes to the right authority, and drafts your complaint letter.
            </p>
            <Link href="/submit" className="btn btn-primary mt-5 flex w-full">
              Report an issue
            </Link>
          </div>

          <div className="panel text-sm">
            <h2 className="font-display font-bold">Routing</h2>
            <ul className="mt-3 space-y-2 text-muted">
              <li>🕳️ Roads → KMC</li>
              <li>🚱 Sewage → KWSB</li>
              <li>🗑️ Garbage → SSWMB</li>
              <li>🚧 Encroachment → TMA</li>
              <li>🛡️ Cantonment → local board</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
