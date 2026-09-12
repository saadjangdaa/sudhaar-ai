import { NextRequest, NextResponse } from "next/server";
import { createAdminRouteClient } from "@/lib/admin/supabase";

const SIGNUP_METADATA = {
  authorityId: null,
  approvalStatus: "pending" as const,
};

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; fullName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  const fullName = body.fullName?.trim();
  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "Email, password, and full name are required." }, { status: 400 });
  }

  const { supabase, withCookies } = createAdminRouteClient(request);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        ...SIGNUP_METADATA,
        fullName,
      },
    },
  });

  if (error) {
    return withCookies(NextResponse.json({ error: error.message }, { status: 400 }));
  }

  return withCookies(
    NextResponse.json({
      ok: true,
      needsConfirmation: !data.session,
    }),
  );
}
