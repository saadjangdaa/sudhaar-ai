import { NextRequest, NextResponse } from "next/server";
import { isSuperAdminEmail, supabasePublicConfig } from "@/lib/admin/env";
import { isApprovedAuthorityAdmin, readAdminMetadata } from "@/lib/admin/session";
import { createAdminProxyClient } from "@/lib/admin/supabase";

function redirectWithCookies(
  url: URL,
  apply: ((target: NextResponse) => NextResponse) | undefined,
) {
  const target = NextResponse.redirect(url);
  return apply ? apply(target) : target;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const login = new URL("/admin/login", request.url);
  const pending = new URL("/admin/pending-approval", request.url);
  const dashboard = new URL("/admin/dashboard", request.url);
  const approvals = new URL("/admin/super/approvals", request.url);

  if (!supabasePublicConfig()) {
    if (pathname === "/admin/login") return NextResponse.next({ request });
    return NextResponse.redirect(login);
  }

  const client = createAdminProxyClient(request);
  if (!client) {
    if (pathname === "/admin/login") return NextResponse.next({ request });
    return NextResponse.redirect(login);
  }

  const { data } = await client.supabase.auth.getUser();
  const user = data.user;
  const apply = client.applyCookies.bind(client);
  const passthrough = client.getResponse();

  if (pathname === "/admin/login") {
    if (!user) return passthrough;
    if (isSuperAdminEmail(user.email)) {
      return redirectWithCookies(approvals, apply);
    }
    if (isApprovedAuthorityAdmin(user)) {
      return redirectWithCookies(dashboard, apply);
    }
    return redirectWithCookies(pending, apply);
  }

  if (!user) {
    return redirectWithCookies(login, apply);
  }

  if (pathname.startsWith("/admin/super")) {
    if (!isSuperAdminEmail(user.email)) {
      return redirectWithCookies(
        isApprovedAuthorityAdmin(user) ? dashboard : pending,
        apply,
      );
    }
    return passthrough;
  }

  if (pathname === "/admin/pending-approval") {
    if (isApprovedAuthorityAdmin(user)) {
      return redirectWithCookies(dashboard, apply);
    }
    if (isSuperAdminEmail(user.email) && readAdminMetadata(user.user_metadata).approvalStatus !== "approved") {
      return passthrough;
    }
    return passthrough;
  }

  if (!isApprovedAuthorityAdmin(user)) {
    if (isSuperAdminEmail(user.email)) {
      return redirectWithCookies(approvals, apply);
    }
    return redirectWithCookies(pending, apply);
  }

  return passthrough;
}

export const config = {
  // Citizen routes are deliberately outside this matcher — the feed, submit flow
  // and /login must stay reachable without an authority session.
  matcher: ["/admin", "/admin/:path*"],
};
