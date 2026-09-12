import Link from "next/link";

import ReportForm from "@/components/ReportForm";

export const metadata = { title: "Report an issue — Sudhaar" };

export default function SubmitPage() {
  return (
    <main className="animate-page-enter mx-auto max-w-2xl px-4 py-6">
      <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">
        ← Back to feed
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">Report a civic issue</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        Photo, voice note, or a few words. Sudhaar classifies it, routes it to the responsible
        Karachi authority, and drafts a formal complaint letter you can send.
      </p>

      <ReportForm />
    </main>
  );
}
