"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getUser } from "@/lib/auth";
import { getSessionId } from "@/lib/session";
import { getSupabase } from "@/lib/supabase/client";

const MAX = 1000;

/**
 * Posting a reply.
 *
 * Writes straight to public.comments with the anon key, which is the exception
 * to the browser never touching Postgres — see the policy comment in
 * supabase/migrations/004_comments.sql for why upvotes need an RPC and this
 * does not. The display name comes from the device-local citizen login when one
 * exists; the CNIC stored alongside it is deliberately never read here, because
 * comments are public and reports must never carry a national ID number.
 */
export default function CommentForm({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = body.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text || busy) return;

    setBusy(true);
    setError(null);
    try {
      const { error: insertError } = await getSupabase().from("comments").insert({
        report_id: reportId,
        author_name: getUser()?.name?.trim() || "Karachi resident",
        body: text.slice(0, MAX),
        session_id: getSessionId(),
      });
      if (insertError) throw insertError;
      setBody("");
      router.refresh();
    } catch {
      setError("Could not post your reply. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor={`reply-${reportId}`} className="sr-only">
        Add a reply
      </label>
      <textarea
        id={`reply-${reportId}`}
        value={body}
        onChange={(e) => {
          setBody(e.target.value.slice(0, MAX));
          setError(null);
        }}
        rows={3}
        placeholder="Seen this too? Add what you know. اردو میں بھی لکھ سکتے ہیں۔"
        className="w-full rounded-lg border border-line bg-background p-3 text-sm outline-none focus:border-brand"
      />

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-danger-weak px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">
          {text.length > MAX - 100 ? `${MAX - text.length} characters left` : "Public reply"}
        </span>
        <button
          type="submit"
          disabled={!text || busy}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Posting…" : "Reply"}
        </button>
      </div>
    </form>
  );
}
