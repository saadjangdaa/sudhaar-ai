// TODO: build by [Saad] — public feed, sorted by upvotes desc then created_at desc.
//
// Read with createServerClient() from src/lib/supabase/server.ts (anon key; reports
// is world-readable). Upvotes go through the upvote_report RPC, never a direct
// table update — see <UpvoteButton/>.
//
//   const { data } = await createServerClient()
//     .from("reports").select("*")
//     .order("upvotes", { ascending: false })
//     .order("created_at", { ascending: false });

export default function FeedPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Community feed</h1>
      <p className="mt-8 rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        Feed list goes here. Seed data is already in the database.
      </p>
    </main>
  );
}
