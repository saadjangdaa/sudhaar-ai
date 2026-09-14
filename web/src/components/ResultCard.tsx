"use client";

import Link from "next/link";
import { useState } from "react";

import AiOverview from "@/components/AiOverview";
import ComplaintLetter from "@/components/ComplaintLetter";
import { emailReport } from "@/lib/api";
import { areaLabel, ISSUE_META } from "@/lib/format";
import type { ReportResponse } from "@/lib/types";

/**
 * Shown when the validator agent rejected the submission.
 *
 * Separated out rather than conditionally emptying the success card: a rejected
 * report has no authority, no letter and nothing to send, so every control on the
 * card below would be dead. Showing a disabled "Send to KMC" button would imply a
 * complaint exists that simply failed to send. None was filed.
 */
function RejectedCard({ report }: { report: ReportResponse }) {
  return (
    <div className="panel space-y-5 border-danger/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-danger-weak px-3 py-1 text-sm font-medium text-danger">
          ⛔ Not filed
        </span>
        <span className="text-sm text-muted">📍 {areaLabel(report.area_tag)}</span>
      </div>

      <p className="text-sm leading-relaxed">
        This report did not pass automated review, so it was not published to the feed
        and no complaint was sent to any authority.
      </p>

      <AiOverview report={report} />

      <div className="rounded-lg bg-surface-2 p-4 text-sm text-muted">
        <p className="font-medium text-foreground">What to do next</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Take the photo at the actual location, in daylight if you can.</li>
          <li>Make sure the problem itself is visible in the frame.</li>
          <li>Describe what is wrong and where, in a sentence or two.</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/submit" className="btn btn-primary">
          Try again
        </Link>
        <Link href={`/c/${report.id}`} className="btn btn-outline">
          View decision
        </Link>
        <Link href="/feed" className="btn btn-ghost">
          Back to feed
        </Link>
      </div>
    </div>
  );
}

export default function ResultCard({ report }: { report: ReportResponse }) {
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ status: string; detail?: string } | null>(null);
  const meta = ISSUE_META[report.issue_type];
  const isUrdu = report.language === "ur";

  // After the hooks, never before — an early return above them would change the
  // hook order between renders.
  const rejected = report.status === "rejected";

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

  if (rejected) return <RejectedCard report={report} />;

  return (
    <div className="panel space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ok-weak px-3 py-1 text-sm font-medium text-ok">
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

      <AiOverview report={report} />

      <ComplaintLetter text={report.complaint_text} isUrdu={isUrdu} />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={send}
          disabled={sending || sendResult?.status === "sent"}
          className="btn btn-primary disabled:opacity-50"
        >
          {sending
            ? "Sending…"
            : sendResult?.status === "sent"
              ? `✓ Sent to ${report.authority_slug.toUpperCase()}`
              : `📨 Send to ${report.authority_slug.toUpperCase()}`}
        </button>
        <a href={mailto} className="btn btn-outline">
          Open in mail app
        </a>
        <Link href={`/c/${report.id}`} className="btn btn-outline">
          View post
        </Link>
        <Link href="/feed" className="btn btn-ghost">
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
