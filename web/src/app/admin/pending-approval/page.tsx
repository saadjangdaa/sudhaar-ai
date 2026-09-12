import { canAccessSuper, getAdminUser, readAdminMetadata } from "@/lib/admin/session";
import { AdminHeader, SuperLink } from "../_components/admin-header";

export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  const user = await getAdminUser();
  const meta = readAdminMetadata(user?.user_metadata);
  const name = meta.fullName ?? user?.email ?? "there";

  return (
    <>
      <AdminHeader
        eyebrow="Sudhaar AI"
        title="Waiting for a desk"
        meta={user?.email ?? undefined}
        actions={user && canAccessSuper(user) ? <SuperLink /> : null}
      />
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="admin-title">Hold here, {name.split(" ")[0]}.</p>
        <p className="admin-meta mt-3">
          Your account is {meta.approvalStatus === "rejected" ? "rejected" : "pending"}. A
          super-admin has to assign an authority before complaints for a Karachi district show
          up on this desk.
        </p>
        {meta.approvalStatus === "rejected" ? (
          <p className="mt-4 rounded-md bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
            This request was rejected. Contact the operator if that looks wrong.
          </p>
        ) : (
          <p className="mt-6 rounded-md bg-[var(--admin-accent-soft)] px-3 py-2 text-sm text-[var(--admin-accent)]">
            You can close this tab. After approval, sign in again and the desk will open.
          </p>
        )}
      </main>
    </>
  );
}
