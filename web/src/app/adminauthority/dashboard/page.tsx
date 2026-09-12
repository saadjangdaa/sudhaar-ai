// TODO: build by [teammate]
//
// Notifications inbox for one authority.
//
// The query is already written and working:
//   getNotificationsForAuthority(authorityId)  src/lib/adminauthority/queries.ts
//   getAllNotifications()                      same file, until login exists
//   getAuthorities()                           same file
//
// Seeded notification rows are already in the database, so this can be built
// against real data immediately. Keep this a SERVER component: the queries use
// the service-role key and must never run in the browser. See ../README.md.

export default function AdminAuthorityDashboardPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold">Authority notifications</h1>
      <p className="mt-8 rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        TODO: build by [teammate]
      </p>
    </main>
  );
}
