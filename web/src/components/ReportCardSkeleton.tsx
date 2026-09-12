/**
 * Skeleton placeholder matching the new ReportCard anatomy exactly.
 *
 * Uses the `.skeleton` class (defined in globals.css) which pulses at 1.6 s —
 * slower than the default Tailwind pulse for a calmer, less jittery feel.
 * Staggered via CSS animation-delay so multiple cards feel organic.
 */
export default function ReportCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-line bg-surface"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Photo placeholder */}
      <div className="skeleton aspect-video w-full" />

      {/* Body */}
      <div className="space-y-2.5 px-4 pb-4 pt-3">
        {/* Meta row */}
        <div className="flex items-center gap-2">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-3 w-14 rounded-full" />
          <div className="skeleton h-3 w-12 rounded-full" />
        </div>

        {/* Title — 2 lines */}
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
        </div>

        {/* Authority line */}
        <div className="skeleton h-3 w-32 rounded-full" />

        {/* Action row */}
        <div className="mt-1 flex gap-2.5">
          <div className="skeleton h-9 w-24 rounded-full" />
          <div className="skeleton h-9 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
