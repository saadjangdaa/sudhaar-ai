import { NextRequest, NextResponse } from "next/server";
import { createAdminRouteClient } from "@/lib/admin/supabase";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const { supabase, withCookies } = createAdminRouteClient(request);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/admin/dashboard`,
      data: {
        authorityId: null,
        approvalStatus: "pending",
      },
    },
  });

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 400 }));
  }

  return withCookies(NextResponse.json({ ok: true }));
}
