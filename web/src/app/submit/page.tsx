import Link from "next/link";

import ReportForm from "@/components/ReportForm";

export const metadata = { title: "Report an issue — Sudhaar" };

export default function SubmitPage() {
  return (
    <div className="animate-page-enter page-column px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/" className="btn btn-ghost !px-0 text-sm">
        ← Feed
      </Link>

      <header className="mt-4">
        <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
          New report
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Report an issue
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Photo, voice note, or a few words. Sudhaar classifies it, routes it to the right
          authority, and drafts a formal complaint letter.
        </p>
      </header>

      <div className="mt-6">
        <ReportForm />
      </div>
    </div>
  );
}
