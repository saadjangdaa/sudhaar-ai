import { NextRequest, NextResponse } from "next/server";
import { getReportsRepository } from "@/lib/admin/data-source";
import { isApprovedAuthorityAdmin } from "@/lib/admin/session";
import { createAdminRouteClient } from "@/lib/admin/supabase";
import { redesignReport } from "@/lib/admin/redesign";

// A vision call regularly takes longer than the platform's 10s default.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { supabase, withCookies } = createAdminRouteClient(request);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user || !isApprovedAuthorityAdmin(user)) {
    return withCookies(NextResponse.json({ error: "Not authorized." }, { status: 401 }));
  }

  let body: { reportId?: string };
  try {
    body = await request.json();
  } catch {
    return withCookies(NextResponse.json({ error: "Invalid request body." }, { status: 400 }));
  }

  const reportId = body.reportId?.trim();
  if (!reportId) {
    return withCookies(NextResponse.json({ error: "reportId is required." }, { status: 400 }));
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

  const result = await redesignReport({
    imageUrl: report.mediaUrl,
    issueType: report.issueType,
    address: report.address,
    complaintText: report.complaintText ?? "",
  });

  if (!result.ok) {
    return withCookies(NextResponse.json({ error: result.error }, { status: 502 }));
  }

  return withCookies(NextResponse.json({ solution: result.solution }));
}
