/** Browser Supabase client. Anon key only — safe to ship, RLS does the guarding. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Built on first use, not at module load.
 *
 * The previous version called createClient() at module scope with `!` assertions,
 * so importing this file threw "supabaseUrl is required" whenever the env vars were
 * absent. That took down the whole production build at prerender — on a repo whose
 * stated design is that the UI stays browsable without credentials — and it broke
 * for any teammate who had not written .env.local yet. Deferring the construction
 * keeps the failure at the point of actual use, where it can be handled.
 */
let _client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and " +
          "NEXT_PUBLIC_SUPABASE_ANON_KEY in web/.env.local",
      );
    }
    _client = createClient(url, key);
  }
  return _client;
}

/** Uploads a photo or voice note and returns its public URL. */
export async function uploadMedia(file: File): Promise<string> {
  const supabase = getSupabase();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("report-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return supabase.storage.from("report-media").getPublicUrl(path).data.publicUrl;
}
