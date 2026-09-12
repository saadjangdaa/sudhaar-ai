/**
 * SERVER-ONLY Supabase client using the service-role key.
 *
 * ############################################################################
 * NEVER import this file from a component marked "use client", and never rename
 * the env var to NEXT_PUBLIC_*. Either mistake publishes full read/write access
 * to the whole database inside the browser JS bundle.
 * ############################################################################
 *
 * Why it exists: public.notifications and public.authorities have RLS enabled
 * with NO policies, so the anon key cannot read them at all. The authority desk under /admin
 * portal therefore reads through this client from server components only.
 *
 * When real per-authority auth lands, the right long-term fix is RLS policies
 * scoped by authorities.auth_user_id plus the normal anon client.
 */
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. See web/.env.example — it must NOT have a NEXT_PUBLIC_ prefix.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}
