"use client";

import { useState } from "react";

/**
 * The formal complaint letter — styled as a document, not debug output.
 * Copy button is the primary action; the letter body uses readable prose typography.
 */
export default function ComplaintLetter({
  text,
  isUrdu = false,
}: {
  text: string;
  isUrdu?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Letter remains selectable if clipboard is blocked.
    }
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card-resting)]">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Complaint letter</h2>
          <p className="text-xs text-muted">Ready to send to the assigned authority</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium transition-all hover:border-brand/40 hover:bg-brand-weak hover:text-brand active:scale-95"
        >
          {copied ? "✓ Copied" : "Copy letter"}
        </button>
      </div>

      <div
        dir={isUrdu ? "rtl" : "ltr"}
        className={`max-h-[28rem] overflow-auto px-5 py-4 text-[15px] leading-relaxed text-foreground/90 ${
          isUrdu ? "urdu text-right" : ""
        }`}
      >
        {text.split("\n").map((paragraph, i) =>
          paragraph.trim() ? (
            <p key={i} className={i > 0 ? "mt-3" : undefined}>
              {paragraph}
            </p>
          ) : (
            <br key={i} />
          ),
        )}
      </div>
    </section>
  );
}
