import { confidenceLabel, isPlaceholderAiOverview } from "@/lib/format";
import type { EvidenceQuality, ReportStatus } from "@/lib/types";

const EVIDENCE_NOTE: Record<EvidenceQuality, string> = {
  strong: "Photo evidence supports the report",
  weak: "Limited evidence — text-only or unclear photo",
  none: "No usable evidence attached",
};

export interface AiOverviewFields {
  ai_overview?: string | null;
  validity_confidence?: number | null;
  evidence_quality?: EvidenceQuality | null;
  status?: ReportStatus | null;
  rejection_reason?: string | null;
}

export default function AiOverview({
  report,
  compact = false,
}: {
  report: AiOverviewFields;
  compact?: boolean;
}) {
  const rejected = report.status === "rejected";
  const text = rejected ? report.rejection_reason : report.ai_overview;
  const unreviewed = !rejected && isPlaceholderAiOverview(text);

  if (unreviewed) {
    return (
      <p className="mt-2 inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted">
        Not yet reviewed
      </p>
    );
  }

  if (!text) return null;

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
    <section className={`mt-4 rounded-2xl border ${accent} p-4`}>
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
