import { NextRequest, NextResponse } from "next/server";
import { createAdminRouteClient } from "@/lib/admin/supabase";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const { supabase, withCookies } = createAdminRouteClient(request);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 401 }));
  }

  return withCookies(NextResponse.json({ ok: true }));
}
