import Link from "next/link";

import { areaLabel, ISSUE_META, timeAgo } from "@/lib/format";
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
  const reports = await getReports({ ...current, sort: "new" });

  const totalUpvotes = reports.reduce((sum, r) => sum + r.upvotes, 0);
  const sent = reports.filter((r) => r.email_status === "sent").length;

  const stats = [
    { label: "Reports", value: reports.length },
    { label: "Total upvotes", value: totalUpvotes },
    { label: "Sent to authority", value: sent },
    { label: "Areas covered", value: new Set(reports.map((r) => r.area_tag)).size },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Every reported issue in Karachi, filterable by area, authority, and type.
      </p>

      {!SUPABASE_CONFIGURED && (
        <p className="mt-4 rounded-lg border border-dashed border-line bg-surface px-4 py-3 text-sm text-muted">
          Showing sample data — Supabase env vars are not set.
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3 rounded-lg border border-line bg-surface p-4">
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

      <div className="mt-5 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Issue</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Authority</th>
              <th className="px-4 py-3 text-right">Upvotes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No reports match these filters.
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const meta = r.issue_type ? ISSUE_META[r.issue_type] : null;
                return (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/c/${r.id}`} className="hover:text-brand">
                        <span className="block max-w-xs truncate font-medium">
                          {r.summary || r.raw_text || "Untitled"}
                        </span>
                        {meta && <span className="text-xs text-muted">{meta.icon} {meta.label}</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{areaLabel(r.area_tag)}</td>
                    <td className="px-4 py-3 text-muted">{r.authority_assigned || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r.upvotes}</td>
                    <td className="px-4 py-3">
                      {r.email_status === "sent" ? (
                        <span className="text-emerald-600 dark:text-emerald-400">✓ Sent</span>
                      ) : (
                        <span className="text-muted">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{timeAgo(r.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
        className={`rounded-full px-2.5 py-1 text-xs ${
          active ? "text-muted hover:bg-surface-2" : "bg-surface-2 font-medium"
        }`}
      >
        All
      </Link>
      {options.map(([value, text]) => (
        <Link
          key={value}
          href={hrefFor(value)}
          className={`rounded-full px-2.5 py-1 text-xs ${
            active === value ? "bg-brand-weak font-medium text-brand" : "text-muted hover:bg-surface-2"
          }`}
        >
          {text}
        </Link>
      ))}
    </div>
  );
}
