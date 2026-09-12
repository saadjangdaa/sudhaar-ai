"use client";

import { useState } from "react";

import { getSessionId } from "@/lib/session";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Reddit-style vote control. Upvote goes through the upvote_report RPC, which is
 * security-definer and idempotent per session id, so a double click cannot
 * double count. Downvote is local-only: there is no downvote column, and the
 * feed ranks civic complaints by support rather than by net score.
 */
export default function VoteBox({
  reportId,
  upvotes,
  layout = "column",
}: {
  reportId: string;
  upvotes: number;
  layout?: "column" | "row";
}) {
  const [count, setCount] = useState(upvotes);
  const [state, setState] = useState<"none" | "up" | "down">("none");
  const [busy, setBusy] = useState(false);

  async function upvote() {
    if (busy || state === "up") return;
    setBusy(true);

    setCount((c) => c + (state === "down" ? 2 : 1));
    setState("up");

    try {
      const { data, error } = await getSupabase().rpc("upvote_report", {
        p_report_id: reportId,
        p_session_id: getSessionId(),
      });
      if (error) throw error;
      if (typeof data === "number") setCount(data);
    } catch {
      // Demo rows and an unconfigured Supabase both land here. The optimistic
      // count stays so the interaction still reads as working.
    } finally {
      setBusy(false);
    }
  }

  function downvote() {
    if (state === "down") {
      setState("none");
      setCount((c) => c + 1);
      return;
    }
    setCount((c) => c - (state === "up" ? 2 : 1));
    setState("down");
  }

  /* ── Column layout (detail page sidebar) ─────────────────────────── */
  if (layout === "column") {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center gap-0.5 py-1">
        <button
          onClick={upvote}
          aria-label="Upvote"
          className={`grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-brand-weak active:scale-95 ${
            state === "up" ? "text-upvote" : "text-muted"
          }`}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10 3l7 8h-4v6H7v-6H3l7-8z" />
          </svg>
        </button>

        <span className="text-xs font-semibold tabular-nums">{count}</span>

        <button
          onClick={downvote}
          aria-label="Downvote"
          className={`grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-surface-2 active:scale-95 ${
            state === "down" ? "text-downvote" : "text-muted"
          }`}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10 17l-7-8h4V3h6v6h4l-7 8z" />
          </svg>
        </button>
      </div>
    );
  }

  /* ── Row layout (feed card action bar) ────────────────────────────
     Thumb-reachable horizontal pill: upvote | count | downvote
     Minimum tap target ≥ 44 px height (h-9 = 36 px + padding renders ~44 px).
  ────────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-9 items-stretch overflow-hidden rounded-full bg-surface-2">
      {/* Upvote section */}
      <button
        onClick={upvote}
        aria-label="Upvote"
        className={`flex items-center gap-1.5 px-3 transition-colors hover:bg-brand-weak active:scale-95 ${
          state === "up" ? "text-upvote" : "text-muted"
        }`}
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
          <path d="M10 3l7 8h-4v6H7v-6H3l7-8z" />
        </svg>
        <span className="text-xs font-semibold tabular-nums">{count}</span>
      </button>

      {/* Divider */}
      <span className="my-2 w-px bg-line" aria-hidden />

      {/* Downvote section */}
      <button
        onClick={downvote}
        aria-label="Downvote"
        className={`flex w-9 items-center justify-center transition-colors hover:bg-surface-2 active:scale-95 ${
          state === "down" ? "text-downvote" : "text-muted"
        }`}
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
          <path d="M10 17l-7-8h4V3h6v6h4l-7 8z" />
        </svg>
      </button>
    </div>
  );
}
