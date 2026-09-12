"use client";

import { useEffect, useState } from "react";

import MediaCapture from "@/components/MediaCapture";
import ResultCard from "@/components/ResultCard";
import { submitReport, warmBackend } from "@/lib/api";
import { uploadMedia } from "@/lib/supabase/client";
import { AREA_LABELS, AREAS, type Language, type MediaType, type ReportResponse } from "@/lib/types";

/**
 * A cold Render dyno plus three model calls is a long silence, so the stages are
 * shown explicitly rather than behind one spinner.
 */
// Mirrors the graph in api/app/graph/pipeline.py. "Checking authenticity" is the
// validator agent; a rejected report stops there and never reaches the last two.
const STAGES = [
  "Uploading",
  "Waking backend",
  "Classifying",
  "Checking authenticity",
  "Routing",
  "Drafting letter",
];

export default function ReportForm() {
  const [text, setText] = useState("");
  const [area, setArea] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType | null>(null);

  const [stage, setStage] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResponse | null>(null);

  useEffect(() => {
    warmBackend();
  }, []);

  const busy = stage >= 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!text.trim() && !file) {
      setError("Describe the problem, or attach a photo or voice note.");
      return;
    }

    setError(null);
    setResult(null);

    try {
      let mediaUrl: string | null = null;

      if (file) {
        setStage(0);
        mediaUrl = await uploadMedia(file);
      }

      setStage(1);
      // Walk the remaining labels while the single request is in flight. The
      // backend runs one graph, so these are indicative, not measured.
      const ticker = setInterval(() => setStage((s) => (s < STAGES.length - 1 ? s + 1 : s)), 2500);

      try {
        const report = await submitReport({
          raw_text: text.trim() || null,
          media_url: mediaUrl,
          media_type: mediaType,
          area_input: area.trim() || null,
          language,
        });
        setResult(report);
      } finally {
        clearInterval(ticker);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setStage(-1);
    }
  }

  if (result) return <ResultCard report={result} />;

  return (
    <form onSubmit={handleSubmit} className="panel space-y-5">
      <div>
        <label htmlFor="text" className="font-display mb-1.5 block text-sm font-semibold">
          What is the problem?
        </label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="e.g. Huge pothole outside my gate, water collects in it every night"
          className="w-full resize-y rounded-xl border border-line bg-[var(--canvas)] px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
        />
      </div>

      <MediaCapture
        onChange={(f, kind) => {
          setFile(f);
          setMediaType(kind);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="area" className="mb-1.5 block text-sm font-medium">
            Area
          </label>
          <input
            id="area"
            list="areas"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. near Hassan Square, Gulshan"
            className="w-full rounded-xl border border-line bg-[var(--canvas)] px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
          />
          <datalist id="areas">
            {AREAS.map((a) => (
              <option key={a} value={AREA_LABELS[a]} />
            ))}
          </datalist>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Letter language</span>
          <div className="flex gap-2">
            {(["en", "ur"] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm ${
                  language === lang
                    ? "border-brand bg-brand-weak text-brand"
                    : "border-line hover:bg-surface-2"
                }`}
              >
                {lang === "en" ? "English" : "اردو"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-danger-weak px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3.5 disabled:opacity-50">
        {busy ? `${STAGES[stage]}…` : "Submit complaint"}
      </button>

      {busy && (
        <div className="flex flex-wrap justify-center gap-2 text-xs text-muted">
          {STAGES.map((label, i) => (
            <span
              key={label}
              className={`rounded-full px-2.5 py-1 ${
                i < stage
                  ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300"
                  : i === stage
                    ? "bg-brand-weak text-brand"
                    : "bg-surface-2"
              }`}
            >
              {i < stage ? "✓" : i === stage ? "•" : "○"} {label}
            </span>
          ))}
        </div>
      )}
    </form>
  );
}
