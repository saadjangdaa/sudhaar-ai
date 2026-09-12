import Link from "next/link";

import { ISSUE_META } from "@/lib/format";
import type { SortKey } from "@/lib/reports";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "new", label: "New" },
];

export default function FeedSortBar({
  sort,
  issueType,
  basePath = "/",
}: {
  sort: SortKey;
  issueType?: string;
  basePath?: string;
}) {
  function href(params: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    if (params.sort && params.sort !== "top") qs.set("sort", params.sort);
    if (params.issue_type) qs.set("issue_type", params.issue_type);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  }

  return (
    <div className="feed-subnav -mx-4 px-4 sm:-mx-0 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={href({ sort: s.key, issue_type: issueType })}
              className={`pill ${sort === s.key ? "pill-active" : ""}`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <div className="scrollbar-none flex gap-1 overflow-x-auto pb-0.5">
          <Link
            href={href({ sort, issue_type: undefined })}
            className={`pill shrink-0 ${!issueType ? "pill-active" : ""}`}
          >
            All
          </Link>
          {Object.entries(ISSUE_META).map(([key, meta]) => (
            <Link
              key={key}
              href={href({ sort, issue_type: key })}
              className={`pill shrink-0 ${issueType === key ? "pill-active" : ""}`}
            >
              {meta.icon} {meta.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
