import Link from "next/link";

import { canAccessSuper, getAdminUser, readAdminMetadata } from "@/lib/admin/session";
import { AdminHeader, SuperLink } from "../_components/admin-header";

export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  const user = await getAdminUser();
  const meta = readAdminMetadata(user?.user_metadata);
  const name = meta.fullName ?? user?.email ?? "there";
  const rejected = meta.approvalStatus === "rejected";

  return (
    <>
      <AdminHeader
        eyebrow="Sudhaar AI"
        title="Account pending"
        meta={user?.email ?? undefined}
        actions={user && canAccessSuper(user) ? <SuperLink /> : null}
      />
      <main className="animate-page-enter mx-auto max-w-lg px-6 py-16">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card-resting)]">
          <h1 className="text-xl font-semibold">
            {rejected ? "Access not granted" : "Awaiting approval"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Hi {name.split(" ")[0]}, your authority account is{" "}
            <span className="font-medium text-foreground">
              {rejected ? "rejected" : "pending review"}
            </span>
            . A super-admin must assign your municipal desk before complaints appear on your
            dashboard.
          </p>

          {rejected ? (
            <div className="mt-4 rounded-xl bg-danger-weak px-4 py-3 text-sm text-danger">
              This request was rejected. Contact the Sudhaar operator if you believe this is a
              mistake.
            </div>
          ) : (
            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li>✓ Your account was created successfully</li>
              <li>⏳ A super-admin will review and assign your authority</li>
              <li>↩ Sign in again after approval — the desk will open automatically</li>
            </ul>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/admin/login"
              className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-95"
            >
              Back to sign-in
            </Link>
            <Link
              href="/"
              className="interactive-chip rounded-full border border-line px-4 py-2 text-sm"
            >
              Public app
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
