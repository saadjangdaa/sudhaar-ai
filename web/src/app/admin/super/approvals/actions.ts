"use server";

import { revalidatePath } from "next/cache";
import { getReportsRepository } from "@/lib/admin/data-source";
import { canAccessSuper, getAdminUser } from "@/lib/admin/session";

export async function setApproval(
  adminId: string,
  status: "approved" | "rejected",
  authorityId?: string,
): Promise<{ error?: string }> {
  const user = await getAdminUser();
  if (!user || !canAccessSuper(user)) {
    return { error: "Not authorized." };
  }

  try {
    await getReportsRepository().setAdminApproval(adminId, status, authorityId);
    revalidatePath("/admin/super/approvals");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update approval." };
  }
}
