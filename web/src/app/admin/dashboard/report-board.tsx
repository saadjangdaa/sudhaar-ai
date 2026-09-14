"use client";

import { AREA_LABELS } from "@/lib/types";
import { uploadMedia } from "@/lib/supabase/client";
import type { Report, ReportStatus } from "@/lib/admin/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { startWork } from "./actions";
import { Badge } from "../_components/ui/badge";
import { Button } from "../_components/ui/button";
import { Card, CardContent, CardFooter } from "../_components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../_components/ui/dialog";
import { Input } from "../_components/ui/input";
import { Label } from "../_components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../_components/ui/tabs";

/**
 * The validator agent rejects a report before it ever reaches an authority, and
 * getReportsForAuthority filters those rows out, so this desk has no "rejected"
 * tab to offer. Tabs and their empty states are typed over what the desk can
 * actually show; statusLabel/statusTone still handle "rejected" so a leaked row
 * renders honestly instead of being stamped "Pending".
 */
type DeskStatus = Exclude<ReportStatus, "rejected">;

const TABS: { id: "all" | DeskStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In Progress" },
  { id: "fixed", label: "Fixed" },
];

const EMPTY: Record<"all" | DeskStatus, string> = {
  all: "No complaints on this desk yet.",
  pending: "Nothing waiting. New complaints will land here.",
  in_progress: "No jobs in progress.",
  fixed: "Nothing marked fixed yet.",
};

function statusLabel(status: ReportStatus) {
  if (status === "in_progress") return "In progress";
  if (status === "fixed") return "Fixed";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function statusTone(status: ReportStatus) {
  return status === "rejected" ? "muted" : status;
}

function issueLabel(issueType: string) {
  return issueType.replace(/_/g, " ");
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ReportBoard({ reports }: { reports: Report[] }) {
  const [tab, setTab] = useState<"all" | DeskStatus>("all");
  const visible = useMemo(
    () => (tab === "all" ? reports : reports.filter((report) => report.status === tab)),
    [reports, tab],
  );

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as "all" | DeskStatus)}>
      <TabsList>
        {TABS.map((item) => {
          const count = item.id === "all" ? reports.length : reports.filter((r) => r.status === item.id).length;
          return (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
              <span
                className="ml-2 text-[11px] text-[var(--admin-muted)]"
                aria-label={`${count} complaints`}
              >
                {count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {TABS.map((item) => (
        <TabsContent key={item.id} value={item.id}>
          {visible.length === 0 ? (
            <p className="admin-meta rounded-lg border border-dashed border-[var(--admin-line)] px-4 py-12 text-center">
              {EMPTY[item.id]}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visible.map((report) => (
                <ComplaintCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

function ComplaintCard({ report }: { report: Report }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fixOpen, setFixOpen] = useState(false);
  const [redesignOpen, setRedesignOpen] = useState(false);
  const [redesignState, setRedesignState] = useState<RedesignState>({ status: "idle" });
  const [actionError, setActionError] = useState<string | null>(null);

  function onStart() {
    setActionError(null);
    startTransition(async () => {
      const result = await startWork(report.id);
      if (result.error) setActionError(result.error);
      else router.refresh();
    });
  }

  async function runRedesign() {
    setRedesignState({ status: "loading" });
    try {
      const response = await fetch("/api/admin/redesign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });
      const payload = (await response.json()) as {
        solution?: string;
        error?: string;
      };
      if (!response.ok || !payload.solution) {
        setRedesignState({ status: "error", message: payload.error ?? "AI re-design failed." });
        return;
      }
      setRedesignState({ status: "done", solution: payload.solution });
    } catch {
      setRedesignState({ status: "error", message: "Network error. Try again." });
    }
  }

  function onOpenRedesign() {
    setRedesignOpen(true);
    if (redesignState.status === "idle") runRedesign();
  }

  return (
    <Card>
      <div className="relative">
        {report.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={report.mediaUrl} alt="" className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center bg-[var(--admin-accent-soft)] text-[var(--admin-muted)]">
            <p className="admin-meta">No photo attached</p>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge tone={statusTone(report.status)}>{statusLabel(report.status)}</Badge>
        </div>
      </div>
      <CardContent className="space-y-2">
        <h2 className="admin-card-title">{report.address}</h2>
        <p className="admin-meta">
          {(AREA_LABELS[report.areaTag] ?? report.areaTag) || "Untagged area"} · {issueLabel(report.issueType)} ·{" "}
          {formatWhen(report.createdAt)}
        </p>
        {report.complaintText ? (
          <p className="line-clamp-3 text-sm leading-5">{report.complaintText}</p>
        ) : null}
        {actionError ? (
          <p className="text-sm text-[var(--admin-danger)]">{actionError}</p>
        ) : null}
      </CardContent>
      <CardFooter>
        {report.status === "pending" ? (
          <Button size="sm" onClick={onStart} disabled={pending}>
            {pending ? "Starting…" : "Start work"}
          </Button>
        ) : null}
        {report.status === "in_progress" ? (
          <Button size="sm" onClick={() => setFixOpen(true)}>
            Mark fixed
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={onOpenRedesign}>
          AI Re-design
        </Button>
      </CardFooter>
      <MarkFixedDialog report={report} open={fixOpen} onOpenChange={setFixOpen} />
      <AiRedesignDialog
        report={report}
        open={redesignOpen}
        onOpenChange={setRedesignOpen}
        state={redesignState}
        onRetry={runRedesign}
      />
    </Card>
  );
}

type RedesignState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; solution: string };

/**
 * Shows the citizen's photo alongside a short AI recommendation, so the desk knows
 * what the fix involves before dispatching a crew. Nothing here is persisted —
 * generation state lives in the parent
 * ComplaintCard and is kept across opens/closes so reopening the dialog doesn't
 * re-spend an API call; "Generate"/"Regenerate" is the only thing that does.
 */
function AiRedesignDialog({
  report,
  open,
  onOpenChange,
  state,
  onRetry,
}: {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: RedesignState;
  onRetry: () => void;
}) {
  const loading = state.status === "loading";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(42rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0">
        <div className="admin-dialog-header px-5 pt-5 pb-4">
          <DialogHeader className="mb-0">
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--ai-weak,#eeebfb)] text-sm">
                ✨
              </span>
              AI re-design
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-prose">
              A crew briefing for the reported issue that you can share on site.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="admin-dialog-body space-y-4 px-5 py-4">
          <ComparisonPanel label="Reported issue" tone="muted">
            {report.mediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={report.mediaUrl}
                alt="Reported issue"
                className="h-52 w-full object-cover"
              />
            ) : (
              <EmptyPhoto label="No citizen photo attached" />
            )}
          </ComparisonPanel>

          {loading ? (
            <div className="admin-dialog-panel-muted flex flex-col items-center justify-center gap-2 rounded-lg px-4 py-8 text-center">
              <span className="size-8 animate-pulse rounded-full bg-[var(--ai-weak,#eeebfb)]" />
              <p className="text-sm font-medium text-[var(--foreground,#1c1c1c)]">
                Drafting recommendation…
              </p>
              <p className="text-xs text-[var(--muted,#6b7280)]">
                This usually takes a few seconds.
              </p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <p className="rounded-lg border border-[var(--danger,#9b2c2c)]/20 bg-[var(--danger-weak,#fdecec)] px-3 py-2.5 text-sm text-[var(--danger,#9b2c2c)]">
              {state.message}
            </p>
          ) : null}

          {state.status === "done" ? (
            <div className="admin-dialog-note overflow-hidden rounded-lg">
              <div className="admin-dialog-header border-b px-4 py-2.5">
                <p className="text-xs font-semibold tracking-wide text-[var(--muted,#6b7280)] uppercase">
                  Recommended fix
                </p>
              </div>
              <p className="max-h-44 overflow-y-auto px-4 py-3 text-sm leading-6 text-[var(--foreground,#1c1c1c)]">
                {state.solution}
              </p>
            </div>
          ) : null}
        </div>

        <div className="admin-dialog-footer flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Close
            </Button>
          </DialogClose>
          <Button onClick={onRetry} disabled={loading} type="button">
            {loading ? "Generating…" : state.status === "done" ? "Regenerate preview" : "Generate preview"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComparisonPanel({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "muted" | "ai";
  children: ReactNode;
}) {
  const labelClass = tone === "ai" ? "admin-dialog-caption-ai" : "admin-dialog-caption-muted";

  return (
    <figure className="admin-dialog-panel overflow-hidden rounded-lg shadow-sm">
      <figcaption
        className={`border-b border-[var(--border,#e2e5e9)] px-3 py-2 text-[11px] font-semibold tracking-wide uppercase ${labelClass}`}
      >
        {label}
      </figcaption>
      {children}
    </figure>
  );
}

function EmptyPhoto({ label }: { label: string }) {
  return (
    <div className="admin-dialog-panel-muted flex h-52 items-center justify-center px-4 text-center">
      <p className="text-sm text-[var(--muted,#6b7280)]">{label}</p>
    </div>
  );
}

function MarkFixedDialog({
  report,
  open,
  onOpenChange,
}: {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setPreview(null);
    setBusy(false);
    setFailure(null);
  }

  function onFile(next: File | null) {
    setFile(next);
    setFailure(null);
    if (!next) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(next);
  }

  async function onVerify() {
    if (!preview) {
      setFailure("Upload a proof photo of the completed work.");
      return;
    }
    if (!file) {
      setFailure("Upload a proof photo of the completed work.");
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      // The proof photo goes to Storage first and only its URL is POSTed.
      //
      // This used to send `preview` — the base64 data URL from FileReader —
      // inside the JSON body. Base64 inflates a file by ~33%, so an ordinary
      // phone photo blew past Vercel's 4.5 MB request-body cap; the platform
      // rejected the request before the route ran, the HTML error page failed
      // to parse as JSON, and the citizen-facing message was "Network error".
      // Storage also means the proof survives as a real, linkable URL instead
      // of the `proof://<id>` placeholder the route had to invent.
      let afterImageUrl: string;
      try {
        afterImageUrl = await uploadMedia(file);
      } catch (uploadError) {
        setFailure(
          uploadError instanceof Error
            ? `Could not upload the proof photo: ${uploadError.message}`
            : "Could not upload the proof photo.",
        );
        return;
      }

      const response = await fetch("/api/admin/verify-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          beforeImageUrl: report.mediaUrl,
          afterImageUrl,
        }),
      });
      const payload = (await response.json()) as {
        verified?: boolean;
        notes?: string;
        error?: string;
      };
      if (!response.ok) {
        setFailure(payload.error ?? "Verification request failed.");
        return;
      }
      if (!payload.verified) {
        setFailure(payload.notes ?? "The proof photo did not pass verification.");
        return;
      }
      reset();
      onOpenChange(false);
      router.refresh();
    } catch {
      setFailure("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark this complaint fixed</DialogTitle>
          <DialogDescription>
            Upload a proof photo. Status only moves to fixed after verification returns a pass —
            not from this screen alone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor={`proof-${report.id}`}>Proof photo</Label>
            <Input
              id={`proof-${report.id}`}
              type="file"
              accept="image/*"
              className="mt-1.5 cursor-pointer pt-1.5"
              onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            />
          </div>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Proof preview" className="h-40 w-full rounded-md object-cover" />
          ) : null}
          {file ? <p className="admin-meta">{file.name}</p> : null}
          {failure ? (
            <p className="rounded-md bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
              {failure}
            </p>
          ) : null}
          <Button onClick={onVerify} disabled={busy || !file}>
            {busy ? "Verifying…" : "Verify and mark fixed"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
