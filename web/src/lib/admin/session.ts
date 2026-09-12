import { isSuperAdminEmail } from "./env";
import { createAdminServerClient } from "./supabase";
import type { AdminUserMetadata } from "./types";

export function readAdminMetadata(raw: unknown): AdminUserMetadata {
  const meta = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const approvalStatus = meta.approvalStatus;
  const status =
    approvalStatus === "approved" || approvalStatus === "rejected" || approvalStatus === "pending"
      ? approvalStatus
      : "pending";
  return {
    authorityId: typeof meta.authorityId === "string" && meta.authorityId ? meta.authorityId : null,
    approvalStatus: status,
    fullName: typeof meta.fullName === "string" ? meta.fullName : undefined,
    designation: typeof meta.designation === "string" ? meta.designation : undefined,
  };
}

export async function getAdminUser() {
  const supabase = await createAdminServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export function isApprovedAuthorityAdmin(user: {
  email?: string | null;
  user_metadata?: unknown;
}): boolean {
  const meta = readAdminMetadata(user.user_metadata);
  return Boolean(meta.authorityId) && meta.approvalStatus === "approved";
}

export function canAccessSuper(user: { email?: string | null }): boolean {
  return isSuperAdminEmail(user.email);
}
