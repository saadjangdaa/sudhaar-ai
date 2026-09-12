import Link from "next/link";

import FeedPagination from "@/components/FeedPagination";
import ReportCard from "@/components/ReportCard";
import { getCommentCounts } from "@/lib/comments";
import { ISSUE_META } from "@/lib/format";
import { getReportsPage, SUPABASE_CONFIGURED } from "@/lib/reports";
import { AREA_LABELS, AREAS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Sudhaar" };

const AUTHORITIES: Record<string, string> = {
  kmc: "KMC",
  kwsb: "KWSB",
  sswmb: "SSWMB",
  tma: "Town Municipal Admin",
  cbc: "Cantonment Board Clifton",
  malir_cb: "Malir Cantonment Board",
  faisal_cb: "Faisal Cantonment Board",
};

function query(base: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const merged = { ...base, ...patch };
  const entries = Object.entries(merged).filter(([, v]) => v);
  return entries.length ? `/dashboard?${new URLSearchParams(entries as [string, string][])}` : "/dashboard";
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const params = await searchParams;
  const area = typeof params.area === "string" ? params.area : undefined;
  const authority = typeof params.authority === "string" ? params.authority : undefined;
  const issueType = typeof params.issue_type === "string" ? params.issue_type : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const current = { area, authority, issue_type: issueType };
  const [feed, commentCounts] = await Promise.all([
    getReportsPage({ ...current, sort: "new", page }),
    getCommentCounts(),
  ]);

  const totalUpvotes = feed.reports.reduce((sum, r) => sum + r.upvotes, 0);
  const sent = feed.reports.filter((r) => r.email_status === "sent").length;

  const stats = [
    { label: "On this page", value: feed.reports.length },
    { label: "Total reports", value: feed.total },
    { label: "Upvotes (page)", value: totalUpvotes },
    { label: "Sent (page)", value: sent },
  ];

  return (
    <main className="animate-page-enter mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Every reported issue in Karachi, filterable by area, authority, and type.
      </p>

      {!SUPABASE_CONFIGURED && (
        <p className="mt-4 rounded-2xl border border-dashed border-line bg-surface px-4 py-3 text-sm text-muted">
          Showing sample data — Supabase env vars are not set.
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3 rounded-2xl border border-line bg-surface p-4">
        <Filter
          label="Type"
          options={Object.entries(ISSUE_META).map(([k, m]) => [k, `${m.icon} ${m.label}`])}
          active={issueType}
          hrefFor={(v) => query(current, { issue_type: v })}
          clearHref={query(current, { issue_type: undefined })}
        />
        <Filter
          label="Authority"
          options={Object.entries(AUTHORITIES)}
          active={authority}
          hrefFor={(v) => query(current, { authority: v })}
          clearHref={query(current, { authority: undefined })}
        />
        <Filter
          label="Area"
          options={AREAS.map((a) => [a, AREA_LABELS[a]] as [string, string])}
          active={area}
          hrefFor={(v) => query(current, { area: v })}
          clearHref={query(current, { area: undefined })}
        />
      </div>

      <div className="mt-5 space-y-3">
        {feed.reports.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
            No reports match these filters.
          </p>
        ) : (
          feed.reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              commentCount={commentCounts.get(report.id) ?? 0}
              variant="compact"
            />
          ))
        )}
      </div>

      <FeedPagination
        page={feed.page}
        totalPages={feed.totalPages}
        basePath="/dashboard"
        searchParams={current}
      />
    </main>
  );
}

function Filter({
  label,
  options,
  active,
  hrefFor,
  clearHref,
}: {
  label: string;
  options: [string, string][];
  active?: string;
  hrefFor: (value: string) => string;
  clearHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-muted">{label}</span>
      <Link
        href={clearHref}
        className={`interactive-chip rounded-full px-2.5 py-1 text-xs ${
          active ? "text-muted" : "bg-surface-2 font-medium"
        }`}
      >
        All
      </Link>
      {options.map(([value, text]) => (
        <Link
          key={value}
          href={hrefFor(value)}
          className={`interactive-chip rounded-full px-2.5 py-1 text-xs ${
            active === value ? "bg-brand-weak font-medium text-brand" : "text-muted"
          }`}
        >
          {text}
        </Link>
      ))}
    </div>
  );
}
