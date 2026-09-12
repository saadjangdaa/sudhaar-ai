import { timeAgo } from "@/lib/format";
import type { CommentRow } from "@/lib/types";
import CommentForm from "./CommentForm";

function isRtl(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

function initials(name: string): string {
  return name.trim().charAt(0) || "?";
}

export default function CommentThread({
  reportId,
  comments,
}: {
  reportId: string;
  comments: CommentRow[];
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold">
        {comments.length === 0
          ? "Replies"
          : `${comments.length} ${comments.length === 1 ? "reply" : "replies"}`}
      </h2>

      {comments.length > 0 && (
        <ul className="mt-4 space-y-3">
          {comments.map((c) => {
            const rtl = isRtl(c.body);
            return (
              <li key={c.id} className="panel flex gap-3 !py-3">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-weak font-display text-sm font-bold text-brand"
                >
                  {initials(c.author_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="font-display font-semibold">{c.author_name}</span>
                    <span className="font-mono text-muted">{timeAgo(c.created_at)}</span>
                  </div>
                  <p
                    dir={rtl ? "rtl" : "ltr"}
                    className={`mt-1.5 text-sm leading-relaxed ${rtl ? "urdu text-right" : ""}`}
                  >
                    {c.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CommentForm reportId={reportId} />
    </section>
  );
}
