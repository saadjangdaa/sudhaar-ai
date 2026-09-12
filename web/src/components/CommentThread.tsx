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
    <section className="mt-6">
      <h2 className="text-base font-semibold">
        {comments.length === 0
          ? "Neighbour replies"
          : `${comments.length} ${comments.length === 1 ? "reply" : "replies"} from neighbours`}
      </h2>

      {comments.length > 0 && (
        <ul className="mt-3 space-y-3">
          {comments.map((c) => {
            const rtl = isRtl(c.body);
            return (
              <li key={c.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand-weak text-sm font-semibold text-brand"
                >
                  {initials(c.author_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
                    <span className="font-medium text-foreground">{c.author_name}</span>
                    <span>·</span>
                    <span>{timeAgo(c.created_at)}</span>
                  </div>
                  <p
                    dir={rtl ? "rtl" : "ltr"}
                    className={`mt-1 text-sm leading-relaxed ${rtl ? "urdu text-right" : ""}`}
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
