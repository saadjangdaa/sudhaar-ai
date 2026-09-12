import type { Authority, AuthorityAdmin, Report, ReportStatus, StatusChangeRecord } from "./types";
import { hasServiceRole } from "./env";
import { createPreSchemaReportsRepository, listSeedAuthorities } from "./mock-data";
import { listDbAuthorities, SupabaseReportsRepository } from "./supabase-repo";

export interface ReportsRepository {
  getMyAuthority(userId: string): Promise<Authority | null>;
  getReportsForAuthority(authorityId: string, status?: ReportStatus): Promise<Report[]>;
  updateReportStatus(record: StatusChangeRecord): Promise<Report>;
  getPendingAdmins(): Promise<AuthorityAdmin[]>;
  /**
   * `authorityId` is required when status is `approved`. Optional on the
   * original contract so a later table-backed repo can still match this call.
   */
  setAdminApproval(
    adminId: string,
    status: "approved" | "rejected",
    authorityId?: string,
  ): Promise<void>;
}

export function getReportsRepository(): ReportsRepository {
  const g = globalThis as { __sudhaarReportsRepo?: ReportsRepository };
  if (!g.__sudhaarReportsRepo) {
    g.__sudhaarReportsRepo = hasServiceRole()
      ? new SupabaseReportsRepository()
      : createPreSchemaReportsRepository();
  }
  return g.__sudhaarReportsRepo;
}

export async function getAuthoritiesCatalog(): Promise<Authority[]> {
  if (!hasServiceRole()) return listSeedAuthorities();
  return listDbAuthorities();
}
