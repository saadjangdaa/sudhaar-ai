import Link from "next/link";

import FeedPagination from "@/components/FeedPagination";
import ReportCard from "@/components/ReportCard";
import { getCommentCounts } from "@/lib/comments";
import { ISSUE_META } from "@/lib/format";
import { getReportsPage, SUPABASE_CONFIGURED, type SortKey } from "@/lib/reports";

export const dynamic = "force-dynamic";

const SORTS: { key: SortKey; label: string; icon: string }[] = [
  { key: "top", label: "Top", icon: "🔥" },
  { key: "new", label: "New", icon: "🕒" },
];

export default async function FeedPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const sort = (params.sort === "new" ? "new" : "top") as SortKey;
  const issueType = typeof params.issue_type === "string" ? params.issue_type : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [feed, commentCounts] = await Promise.all([
    getReportsPage({ sort, issue_type: issueType, page }),
    getCommentCounts(),
  ]);

  const queryBase = { sort: sort === "top" ? undefined : sort, issue_type: issueType };

  return (
    <main className="animate-page-enter mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        {!SUPABASE_CONFIGURED && (
          <p className="mb-4 rounded-2xl border border-dashed border-line bg-surface px-4 py-3 text-sm text-muted">
            Showing sample data — add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="font-mono">web/.env.local</code> to read live reports.
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={s.key === "top" ? "/" : "/?sort=new"}
              className={`interactive-chip rounded-full px-3 py-1.5 text-sm font-medium ${
                sort === s.key ? "bg-brand-weak text-brand" : "text-muted"
              }`}
            >
              {s.icon} {s.label}
            </Link>
          ))}

          <div className="ml-auto flex flex-wrap gap-1">
            <Link
              href={sort === "new" ? "/?sort=new" : "/"}
              className={`interactive-chip rounded-full px-2.5 py-1 text-xs ${
                issueType ? "text-muted" : "bg-surface-2 font-medium"
              }`}
            >
              All
            </Link>
            {Object.entries(ISSUE_META).map(([key, meta]) => (
              <Link
                key={key}
                href={`/?sort=${sort}&issue_type=${key}`}
                className={`interactive-chip rounded-full px-2.5 py-1 text-xs ${
                  issueType === key ? "bg-surface-2 font-medium" : "text-muted"
                }`}
              >
                {meta.icon} {meta.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {feed.reports.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
              No reports yet.{" "}
              <Link href="/submit" className="text-brand hover:underline">
                Be the first to report an issue.
              </Link>
            </p>
          ) : (
            feed.reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                commentCount={commentCounts.get(report.id) ?? 0}
              />
            ))
          )}
        </div>

        <FeedPagination
          page={feed.page}
          totalPages={feed.totalPages}
          basePath="/"
          searchParams={queryBase}
        />
      </div>

      <aside className="hidden space-y-4 lg:block">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-semibold">About Sudhaar</h2>
          <p className="mt-2 text-sm text-muted">
            Report a civic issue in Karachi with a photo, a voice note, or a few words. It gets
            classified, routed to the responsible authority, and turned into a formal complaint
            letter in English or Urdu.
          </p>
          <Link
            href="/submit"
            className="mt-4 block rounded-full bg-brand px-4 py-2 text-center text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-95"
          >
            Report an issue
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
          <h2 className="font-semibold">How routing works</h2>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>🕳️ Potholes and roads → KMC</li>
            <li>🚱 Sewage and water → KWSB</li>
            <li>🗑️ Garbage → SSWMB</li>
            <li>🚧 Encroachment → Town Municipal Admin</li>
            <li>🛡️ Cantonment areas → their own board</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
