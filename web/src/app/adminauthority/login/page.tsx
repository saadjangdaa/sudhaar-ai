// TODO: build by [teammate]
//
// Supabase Auth sign-in for an authority account. Nothing is implemented yet and
// nothing else in the app links here.
//
// authorities.auth_user_id (nullable, references auth.users) already exists in the
// schema for exactly this: after sign-in, match the logged-in user to their
// authority row. See ../README.md before starting.

export default function AdminAuthorityLoginPage() {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold">Authority sign in</h1>
      <p className="mt-8 rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        TODO: build by [teammate]
      </p>
    </main>
  );
}
