"use client";

import { useState } from "react";

import { getSessionId } from "@/lib/session";
import { getSupabase } from "@/lib/supabase/client";

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
      /* optimistic count stays */
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

  const upActive = state === "up";
  const downActive = state === "down";

  if (layout === "column") {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center gap-1 py-1">
        <button
          onClick={upvote}
          aria-label="Upvote"
          className={`grid h-9 w-9 place-items-center rounded-xl transition-all hover:bg-brand-weak active:scale-90 ${
            upActive ? "bg-brand-weak text-brand" : "text-muted"
          }`}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10 3l7 8h-4v6H7v-6H3l7-8z" />
          </svg>
        </button>
        <span className="font-mono text-xs font-bold tabular-nums">{count}</span>
        <button
          onClick={downvote}
          aria-label="Downvote"
          className={`grid h-9 w-9 place-items-center rounded-xl transition-all hover:bg-surface-2 active:scale-90 ${
            downActive ? "text-downvote" : "text-muted"
          }`}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10 17l-7-8h4V3h6v6h4l-7 8z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-10 items-stretch overflow-hidden rounded-full border border-line bg-[var(--surface-hover)]">
      <button
        onClick={upvote}
        aria-label={`Upvote, ${count} votes`}
        className={`flex items-center gap-1.5 px-3.5 transition-all hover:bg-brand-weak active:scale-95 ${
          upActive ? "text-brand" : "text-muted"
        }`}
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
          <path d="M10 3l7 8h-4v6H7v-6H3l7-8z" />
        </svg>
        <span className="font-mono text-xs font-bold tabular-nums">{count}</span>
      </button>
      <span className="my-2.5 w-px bg-line" aria-hidden />
      <button
        onClick={downvote}
        aria-label="Downvote"
        className={`flex w-10 items-center justify-center transition-all hover:bg-surface-2 active:scale-95 ${
          downActive ? "text-downvote" : "text-muted"
        }`}
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
          <path d="M10 17l-7-8h4V3h6v6h4l-7 8z" />
        </svg>
      </button>
    </div>
  );
}
