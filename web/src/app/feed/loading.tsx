import ReportCardSkeleton from "@/components/ReportCardSkeleton";

export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[1fr_18rem] lg:gap-10">
      <div className="feed-column space-y-4 lg:max-w-none">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-4 w-64 rounded" />
        <div className="skeleton mt-4 h-10 w-full rounded-full" />
        {Array.from({ length: 3 }, (_, i) => (
          <ReportCardSkeleton key={i} delay={i * 80} />
        ))}
      </div>
    </div>
  );
}
