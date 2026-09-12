import Link from "next/link";

import ReportCard from "@/components/ReportCard";
import { getCommentCounts } from "@/lib/comments";
import { ISSUE_META } from "@/lib/format";
import { getReports, SUPABASE_CONFIGURED } from "@/lib/reports";
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

  const current = { area, authority, issue_type: issueType };
  const [reports, commentCounts] = await Promise.all([
    getReports({ ...current, sort: "new" }),
    getCommentCounts(),
  ]);

  const totalUpvotes = reports.reduce((sum, r) => sum + r.upvotes, 0);
  const sent = reports.filter((r) => r.email_status === "sent").length;

  const stats = [
    { label: "Reports", value: reports.length },
    { label: "Upvotes", value: totalUpvotes },
    { label: "Sent", value: sent },
    { label: "Areas", value: new Set(reports.map((r) => r.area_tag)).size },
  ];

  return (
    <div className="animate-page-enter wide-column px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
          Overview
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          City dashboard
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Filter reports by area, authority, and issue type.
        </p>
      </header>

      {!SUPABASE_CONFIGURED && (
        <p className="panel mt-4 border-dashed text-sm text-muted">
          Sample data — Supabase env vars are not set.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel !py-4">
            <p className="font-display text-3xl font-bold tabular-nums">{s.value}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="panel mt-5 space-y-4">
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

      <div className="mt-6 space-y-4 sm:space-y-5">
        {reports.length === 0 ? (
          <div className="panel py-12 text-center text-muted">No reports match these filters.</div>
        ) : (
          reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              commentCount={commentCounts.get(report.id) ?? 0}
              variant="compact"
            />
          ))
        )}
      </div>
    </div>
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
      <span className="w-20 shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted">
        {label}
      </span>
      <Link href={clearHref} className={`pill ${active ? "" : "pill-active"}`}>
        All
      </Link>
      {options.map(([value, text]) => (
        <Link
          key={value}
          href={hrefFor(value)}
          className={`pill ${active === value ? "pill-active" : ""}`}
        >
          {text}
        </Link>
      ))}
    </div>
  );
}
