import { NextRequest, NextResponse } from "next/server";
import { createAdminRouteClient } from "@/lib/admin/supabase";

export async function POST(request: NextRequest) {
  const { supabase, withCookies } = createAdminRouteClient(request);
  await supabase.auth.signOut();
  return withCookies(NextResponse.json({ ok: true }));
}
