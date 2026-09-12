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
      <span className="inline-flex rounded-md bg-[var(--surface-hover)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
        Not yet reviewed
      </span>
    );
  }

  if (!text) return null;

  const accent = rejected ? "border-danger/30 bg-danger-weak" : "border-ai/25 bg-ai-weak";
  const label = rejected ? "Rejected" : "AI overview";

  if (compact) {
    return (
      <p className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${accent}`}>
        <span className="font-display font-semibold text-ai">{label}: </span>
        <span className="text-foreground/75">{text}</span>
      </p>
    );
  }

  return (
    <section className={`rounded-xl border p-4 ${accent}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-sm font-bold text-ai">{label}</h3>
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
          {confidenceLabel(report.validity_confidence)}
          {report.evidence_quality ? ` · ${EVIDENCE_NOTE[report.evidence_quality]}` : ""}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/85">{text}</p>
      <p className="mt-3 text-xs text-muted">
        Automated assessment from submitted photo and text — not a verified finding.
      </p>
    </section>
  );
}
