import { NextRequest, NextResponse } from "next/server";
import { getReportsRepository } from "@/lib/admin/data-source";
import { isApprovedAuthorityAdmin } from "@/lib/admin/session";
import { createAdminRouteClient } from "@/lib/admin/supabase";
import { verifyFix } from "@/lib/admin/verify-fix";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const { supabase, withCookies } = createAdminRouteClient(request);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user || !isApprovedAuthorityAdmin(user)) {
    return withCookies(NextResponse.json({ error: "Not authorized." }, { status: 401 }));
  }

  let body: { reportId?: string; beforeImageUrl?: string; afterImageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return withCookies(NextResponse.json({ error: "Invalid request body." }, { status: 400 }));
  }

  const reportId = body.reportId?.trim();
  const afterImageUrl = body.afterImageUrl?.trim();
  if (!reportId || !afterImageUrl) {
    return withCookies(
      NextResponse.json({ error: "reportId and afterImageUrl are required." }, { status: 400 }),
    );
  }

  const repo = getReportsRepository();
  const authority = await repo.getMyAuthority(user.id);
  if (!authority) {
    return withCookies(NextResponse.json({ error: "No authority desk assigned." }, { status: 403 }));
  }

  const reports = await repo.getReportsForAuthority(authority.id);
  const report = reports.find((row) => row.id === reportId);
  if (!report) {
    return withCookies(NextResponse.json({ error: "Report is not on this desk." }, { status: 404 }));
  }

  const result = await verifyFix({
    reportId,
    beforeImageUrl: report.mediaUrl,
    afterImageUrl,
  });

  if (!result.verified) {
    return withCookies(NextResponse.json(result));
  }

  await repo.updateReportStatus({
    reportId,
    oldStatus: report.status,
    newStatus: "fixed",
    changedBy: user.id,
    proofMediaUrl: afterImageUrl.startsWith("data:") ? `proof://${reportId}` : afterImageUrl,
    aiVerified: true,
    aiConfidence: result.confidence,
  });

  revalidatePath("/admin/dashboard");
  return withCookies(NextResponse.json(result));
}
