import Link from "next/link";

/**
 * URL-based pagination for the feed and dashboard.
 * No client JS — each page is a full server render.
 */
export default function FeedPagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav
      aria-label="Feed pagination"
      className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
    >
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page <= 1}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
          page <= 1
            ? "pointer-events-none text-muted/50"
            : "text-muted hover:bg-surface-2 hover:text-foreground"
        }`}
      >
        ← Previous
      </Link>

      <span className="text-sm text-muted">
        Page <span className="font-semibold text-foreground">{page}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </span>

      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page >= totalPages}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
          page >= totalPages
            ? "pointer-events-none text-muted/50"
            : "bg-brand text-white hover:opacity-90"
        }`}
      >
        Next →
      </Link>
    </nav>
  );
}
