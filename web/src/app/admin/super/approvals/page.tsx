import { getAuthoritiesCatalog, getReportsRepository } from "@/lib/admin/data-source";
import { getAdminUser, isApprovedAuthorityAdmin } from "@/lib/admin/session";
import { AdminHeader, DeskLink } from "../../_components/admin-header";
import { ApprovalsList } from "./approvals-list";

export const dynamic = "force-dynamic";

export default async function SuperApprovalsPage() {
  const user = await getAdminUser();
  const pending = await getReportsRepository().getPendingAdmins();
  const authorities = await getAuthoritiesCatalog();

  return (
    <>
      <AdminHeader
        eyebrow="Super-admin"
        title="Desk approvals"
        meta={user?.email ?? undefined}
        actions={user && isApprovedAuthorityAdmin(user) ? <DeskLink /> : null}
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="admin-meta mb-6 max-w-2xl">
          These accounts signed up with pending metadata. Assign a live authority
          from <code>public.authorities</code>, then approve. Complaints are scoped
          by <code>reports.authority_slug</code>.
        </p>
        {pending.length === 0 ? (
          <p className="admin-meta rounded-lg border border-dashed border-[var(--admin-line)] px-4 py-12 text-center">
            No one is waiting. New signups appear here until you assign a desk.
          </p>
        ) : (
          <ApprovalsList pending={pending} authorities={authorities} />
        )}
      </main>
    </>
  );
}
