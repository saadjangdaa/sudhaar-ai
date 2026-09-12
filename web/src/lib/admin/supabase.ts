import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { supabasePublicConfig } from "./env";

export async function createAdminServerClient() {
  const config = supabasePublicConfig();
  if (!config) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component. proxy.ts writes refreshed cookies.
        }
      },
    },
  });
}

export function createAdminProxyClient(request: NextRequest) {
  const config = supabasePublicConfig();
  if (!config) return null;

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    getResponse() {
      return response;
    },
    applyCookies(target: NextResponse) {
      response.cookies.getAll().forEach((cookie) => {
        target.cookies.set(cookie.name, cookie.value);
      });
      return target;
    },
  };
}

export function createAdminRouteClient(request: NextRequest) {
  const config = supabasePublicConfig();
  if (!config) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const pending: { name: string; value: string; options?: CookieOptions }[] = [];
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => {
          pending.push(cookie);
        });
      },
    },
  });

  return {
    supabase,
    withCookies(response: NextResponse) {
      pending.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    },
  };
}
