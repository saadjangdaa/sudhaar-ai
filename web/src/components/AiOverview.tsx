import { confidenceLabel } from "@/lib/format";
import type { EvidenceQuality, ReportStatus } from "@/lib/types";

const EVIDENCE_NOTE: Record<EvidenceQuality, string> = {
  strong: "Photo evidence supports the report",
  weak: "Limited evidence — text-only or unclear photo",
  none: "No usable evidence attached",
};

/**
 * Only the validator fields, each optional.
 *
 * ReportRow and ReportResponse disagree on nullability — a row has `string | null`
 * where the response has `string | null | undefined` — and a row read before the
 * migration ran has none of them. Accepting the loose shape here means one
 * component serves the feed, the detail page and the submit result.
 */
export interface AiOverviewFields {
  ai_overview?: string | null;
  validity_confidence?: number | null;
  evidence_quality?: EvidenceQuality | null;
  status?: ReportStatus | null;
  rejection_reason?: string | null;
}

/**
 * The validator agent's own words, shown on the post.
 *
 * Deliberately labelled as machine-written and styled apart from the platform's
 * brand colour: a reader must never mistake an AI judgement for Sudhaar's
 * editorial position, and an authority reading this needs to see the confidence
 * behind a verdict, not just the verdict.
 */
export default function AiOverview({
  report,
  compact = false,
}: {
  report: AiOverviewFields;
  compact?: boolean;
}) {
  const text = report.status === "rejected" ? report.rejection_reason : report.ai_overview;
  if (!text) return null;

  const rejected = report.status === "rejected";
  const accent = rejected ? "border-danger/40 bg-danger-weak" : "border-ai/30 bg-ai-weak";
  const dot = rejected ? "text-danger" : "text-ai";

  if (compact) {
    return (
      <p className={`mt-2 rounded-md border ${accent} px-2.5 py-1.5 text-xs leading-relaxed`}>
        <span className={`font-semibold ${dot}`}>{rejected ? "⛔ AI: " : "✨ AI overview: "}</span>
        <span className="text-foreground/80">{text}</span>
      </p>
    );
  }

  return (
    <section className={`mt-4 rounded-lg border ${accent} p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={`text-sm font-semibold ${dot}`}>
          {rejected ? "⛔ Rejected by automated review" : "✨ AI overview"}
        </h3>
        <span className="text-[11px] text-muted">
          {confidenceLabel(report.validity_confidence)}
          {report.evidence_quality ? ` · ${EVIDENCE_NOTE[report.evidence_quality]}` : ""}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-foreground/85">{text}</p>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Written by Sudhaar&rsquo;s complaint-validation agent from the photo and text
        submitted. It is an automated assessment, not a verified finding
        {rejected ? " — a person can still review this decision." : "."}
      </p>
    </section>
  );
}
