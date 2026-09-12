/** Browser Supabase client. Anon key only — safe to ship, RLS does the guarding. */
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/** Uploads a photo or voice note and returns its public URL. */
export async function uploadMedia(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("report-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return supabase.storage.from("report-media").getPublicUrl(path).data.publicUrl;
}
