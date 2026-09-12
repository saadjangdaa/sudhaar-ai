"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getUser } from "@/lib/auth";
import { getSessionId } from "@/lib/session";
import { getSupabase } from "@/lib/supabase/client";

const MAX = 1000;

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
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-line bg-surface p-4">
      <label htmlFor={`reply-${reportId}`} className="mb-2 block text-sm font-semibold">
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
        className="w-full rounded-xl border border-line bg-background p-3 text-sm outline-none transition-colors focus:border-brand"
      />

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-danger-weak px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex items-center justify-end gap-3">
        {text.length > MAX - 100 && (
          <span className="text-xs text-muted">{MAX - text.length} characters left</span>
        )}
        <button
          type="submit"
          disabled={!text || busy}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {busy ? "Posting…" : "Post reply"}
        </button>
      </div>
    </form>
  );
}
