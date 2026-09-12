"use client";

import { AREA_LABELS } from "@/lib/types";
import type { Report, ReportStatus } from "@/lib/admin/types";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { startWork } from "./actions";
import { Badge } from "../_components/ui/badge";
import { Button } from "../_components/ui/button";
import { Card, CardContent, CardFooter } from "../_components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../_components/ui/dialog";
import { Input } from "../_components/ui/input";
import { Label } from "../_components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../_components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "../_components/ui/tooltip";

const TABS: { id: "all" | ReportStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In Progress" },
  { id: "fixed", label: "Fixed" },
];

const EMPTY: Record<"all" | ReportStatus, string> = {
  all: "No complaints on this desk yet.",
  pending: "Nothing waiting. New complaints will land here.",
  in_progress: "No jobs in progress.",
  fixed: "Nothing marked fixed yet.",
};

function statusLabel(status: ReportStatus) {
  if (status === "in_progress") return "In progress";
  if (status === "fixed") return "Fixed";
  return "Pending";
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
  const [tab, setTab] = useState<"all" | ReportStatus>("all");
  const visible = useMemo(
    () => (tab === "all" ? reports : reports.filter((report) => report.status === tab)),
    [reports, tab],
  );

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as "all" | ReportStatus)}>
      <TabsList>
        {TABS.map((item) => {
          const count = item.id === "all" ? reports.length : reports.filter((r) => r.status === item.id).length;
          return (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
              <span className="ml-2 text-[11px] text-[var(--admin-muted)]">{count}</span>
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
  const [actionError, setActionError] = useState<string | null>(null);

  function onStart() {
    setActionError(null);
    startTransition(async () => {
      const result = await startWork(report.id);
      if (result.error) setActionError(result.error);
      else router.refresh();
    });
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
          <Badge tone={report.status}>{statusLabel(report.status)}</Badge>
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
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button size="sm" variant="outline" disabled>
                AI Re-design
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </CardFooter>
      <MarkFixedDialog report={report} open={fixOpen} onOpenChange={setFixOpen} />
    </Card>
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
    setBusy(true);
    setFailure(null);
    try {
      const response = await fetch("/api/admin/verify-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          beforeImageUrl: report.mediaUrl,
          afterImageUrl: preview,
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
