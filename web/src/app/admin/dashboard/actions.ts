"use server";

import { revalidatePath } from "next/cache";
import { getReportsRepository } from "@/lib/admin/data-source";
import { getAdminUser, isApprovedAuthorityAdmin } from "@/lib/admin/session";

export async function startWork(reportId: string): Promise<{ error?: string }> {
  const user = await getAdminUser();
  if (!user || !isApprovedAuthorityAdmin(user)) {
    return { error: "Not authorized." };
  }

  const repo = getReportsRepository();
  const authority = await repo.getMyAuthority(user.id);
  if (!authority) {
    return { error: "No authority desk assigned." };
  }

  const reports = await repo.getReportsForAuthority(authority.id);
  const report = reports.find((row) => row.id === reportId);
  if (!report) return { error: "Report is not on this desk." };
  if (report.status !== "pending") return { error: "Only pending complaints can be started." };

  await repo.updateReportStatus({
    reportId,
    oldStatus: "pending",
    newStatus: "in_progress",
    changedBy: user.id,
  });

  revalidatePath("/admin/dashboard");
  return {};
}
