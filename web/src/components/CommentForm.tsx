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
    <form onSubmit={submit} className="panel mt-4">
      <label htmlFor={`reply-${reportId}`} className="font-display text-sm font-bold">
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
        className="mt-3 w-full resize-none rounded-xl border border-line bg-[var(--canvas)] px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger-weak px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-end gap-3">
        {text.length > MAX - 100 && (
          <span className="font-mono text-xs text-muted">{MAX - text.length} left</span>
        )}
        <button type="submit" disabled={!text || busy} className="btn btn-primary disabled:opacity-40">
          {busy ? "Posting…" : "Post reply"}
        </button>
      </div>
    </form>
  );
}
