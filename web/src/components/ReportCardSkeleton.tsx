export default function ReportCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="feed-card overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="skeleton aspect-[4/3] w-full sm:aspect-video" />
      <div className="space-y-3 p-5">
        <div className="flex gap-2">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-3 w-14 rounded-full" />
        </div>
        <div className="skeleton h-5 w-full rounded" />
        <div className="skeleton h-5 w-2/3 rounded" />
        <div className="flex gap-2 pt-1">
          <div className="skeleton h-10 w-24 rounded-full" />
          <div className="skeleton h-10 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
