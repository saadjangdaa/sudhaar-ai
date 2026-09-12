// TODO: build by [Saad] — authority dashboard. No login, by design.
//
// Server component driven by searchParams: area, authority, issue_type.
// Read with createServerClient(); filter with .eq() only when a param is present.

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Authority dashboard</h1>
      <p className="mt-8 rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        Filterable reports table goes here.
      </p>
    </main>
  );
}
