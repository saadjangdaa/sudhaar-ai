"use client";

import { useState } from "react";

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
      /* selectable on screen */
    }
  }

  return (
    <section className="panel mt-5 overflow-hidden !p-0">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display font-bold">Complaint letter</h2>
          <p className="mt-0.5 text-xs text-muted">Ready to send to the assigned authority</p>
        </div>
        <button type="button" onClick={copy} className="btn btn-soft shrink-0">
          {copied ? "Copied" : "Copy letter"}
        </button>
      </div>

      <div
        dir={isUrdu ? "rtl" : "ltr"}
        className={`max-h-[28rem] overflow-auto px-5 py-5 text-[15px] leading-[1.75] text-foreground/90 ${
          isUrdu ? "urdu text-right" : ""
        }`}
      >
        {text.split("\n").map((paragraph, i) =>
          paragraph.trim() ? (
            <p key={i} className={i > 0 ? "mt-4" : undefined}>
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
