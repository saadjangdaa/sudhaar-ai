import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "./sign-out-button";

export function AdminHeader({
  eyebrow,
  title,
  meta,
  actions,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-[var(--admin-line)] bg-[var(--admin-card)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-6 py-5">
        <div>
          <p className="admin-meta tracking-wide uppercase">{eyebrow}</p>
          <h1 className="admin-title mt-1">{title}</h1>
          {meta ? <p className="admin-meta mt-1">{meta}</p> : null}
        </div>
        <div className="flex items-center gap-4">
          {actions}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

export function SuperLink() {
  return (
    <Link href="/admin/super/approvals" className="admin-meta underline-offset-2 hover:underline">
      Approvals
    </Link>
  );
}

export function DeskLink() {
  return (
    <Link href="/admin/dashboard" className="admin-meta underline-offset-2 hover:underline">
      Desk
    </Link>
  );
}
