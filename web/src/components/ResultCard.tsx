"use client";

import Link from "next/link";
import { useState } from "react";

import { emailReport } from "@/lib/api";
import { areaLabel, ISSUE_META } from "@/lib/format";
import type { ReportResponse } from "@/lib/types";

export default function ResultCard({ report }: { report: ReportResponse }) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ status: string; detail?: string } | null>(null);
  const meta = ISSUE_META[report.issue_type];
  const isUrdu = report.language === "ur";

  const mailto = `mailto:${report.authority_email ?? ""}?subject=${encodeURIComponent(
    `${meta?.label ?? "Civic"} complaint — ${areaLabel(report.area_tag)}`,
  )}&body=${encodeURIComponent(report.complaint_text)}`;

  async function send() {
    if (sending) return;
    setSending(true);
    try {
      const res = await emailReport(report.id);
      setSendResult({ status: res.email_status, detail: res.detail });
    } catch (err) {
      setSendResult({
        status: "failed",
        detail: err instanceof Error ? err.message : "Could not reach the server",
      });
    } finally {
      setSending(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(report.complaint_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the text is selectable on screen anyway
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-600/15 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          ✓ Complaint filed
        </span>
        {meta && (
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${meta.tone}`}>
            {meta.icon} {meta.label}
          </span>
        )}
        <span className="text-sm text-muted">📍 {areaLabel(report.area_tag)}</span>
      </div>

      <div className="rounded-lg bg-surface-2 p-4">
        <p className="text-xs uppercase tracking-wide text-muted">Routed to</p>
        <p className="mt-1 font-semibold">{report.authority_assigned}</p>
        {report.authority_email && <p className="text-sm text-muted">{report.authority_email}</p>}
        {report.routing_reason && (
          <p className="mt-2 text-sm text-muted">{report.routing_reason}</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">Complaint letter</p>
        <pre
          dir={isUrdu ? "rtl" : "ltr"}
          className={`max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-background p-4 text-sm ${
            isUrdu ? "urdu text-right" : "font-sans"
          }`}
        >
          {report.complaint_text}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={send}
          disabled={sending || sendResult?.status === "sent"}
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {sending
            ? "Sending…"
            : sendResult?.status === "sent"
              ? `✓ Sent to ${report.authority_slug.toUpperCase()}`
              : `📨 Send to ${report.authority_slug.toUpperCase()}`}
        </button>
        <button
          onClick={copy}
          className="rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2"
        >
          {copied ? "✓ Copied" : "📋 Copy letter"}
        </button>
        <a
          href={mailto}
          className="rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2"
        >
          ✉️ Open in mail app
        </a>
        <Link
          href={`/c/${report.id}`}
          className="rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2"
        >
          View post
        </Link>
        <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-2">
          Back to feed
        </Link>
      </div>

      {sendResult && sendResult.status !== "sent" && (
        <p className="rounded-lg border border-line bg-surface-2 p-3 text-sm text-muted">
          {sendResult.status === "skipped"
            ? "Auto-send is off on the server. Use “Open in mail app” to send it yourself."
            : `Could not send: ${sendResult.detail ?? "unknown error"}`}
        </p>
      )}
    </div>
  );
}
