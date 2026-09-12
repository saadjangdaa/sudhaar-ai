import { AREA_LABELS } from "@/lib/types";
import { getReportsRepository } from "@/lib/admin/data-source";
import { canAccessSuper, getAdminUser } from "@/lib/admin/session";
import { AdminHeader, SuperLink } from "../_components/admin-header";
import { ReportBoard } from "./report-board";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getAdminUser();
  if (!user) return null;

  const repo = getReportsRepository();
  const authority = await repo.getMyAuthority(user.id);
  if (!authority) {
    return (
      <>
        <AdminHeader
          eyebrow="Field desk"
          title="Desk not linked"
          meta={user.email ?? undefined}
          actions={canAccessSuper(user) ? <SuperLink /> : null}
        />
        <main className="mx-auto max-w-lg px-6 py-16">
          <p className="admin-title">This account is not tied to a live authority.</p>
          <p className="admin-meta mt-3">
            Approval metadata must point at a row in <code>public.authorities</code>. A
            super-admin can re-assign the desk from Approvals.
          </p>
        </main>
      </>
    );
  }

  const reports = await repo.getReportsForAuthority(authority.id);
  const areas = authority.areaTags.map((tag) => AREA_LABELS[tag] ?? tag).join(" · ");
  const meta =
    areas ||
    (authority.slug ? `Live desk · ${authority.slug}` : "Live complaints routed to this desk");

  return (
    <>
      <AdminHeader
        eyebrow="Field desk"
        title={authority.name}
        meta={meta}
        actions={canAccessSuper(user) ? <SuperLink /> : null}
      />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <ReportBoard reports={reports} />
      </main>
    </>
  );
}
