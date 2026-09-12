import ReportCardSkeleton from "@/components/ReportCardSkeleton";

/**
 * Shown by Next.js while the feed page is streaming from the server.
 * Matches the new ReportCard anatomy so the transition feels like a
 * same-shape content reveal rather than a layout shift.
 */
export default function FeedLoading() {
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <ReportCardSkeleton key={i} delay={i * 60} />
        ))}
      </div>

      {/* Sidebar placeholder */}
      <aside className="hidden space-y-4 lg:block">
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="skeleton h-40 w-full" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
            <div className="skeleton mt-3 h-9 w-full rounded-full" />
          </div>
        </div>
      </aside>
    </main>
  );
}
