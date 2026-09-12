import ReportCardSkeleton from "@/components/ReportCardSkeleton";

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="skeleton h-8 w-40 rounded" />
      <div className="skeleton mt-2 h-4 w-72 rounded" />
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <ReportCardSkeleton key={i} delay={i * 60} />
        ))}
      </div>
    </main>
  );
}
