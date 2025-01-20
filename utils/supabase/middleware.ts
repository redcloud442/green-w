import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ensureValidSession } from "../serversideProtection";

export async function updateSession(request: NextRequest) {
  // Check if the session validation has already occurred
  if (request.headers.get("x-session-checked")) {
    return addSecurityHeaders(NextResponse.next());
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  const isMagicLinkCallback = request.nextUrl.pathname === "/auth/callback";

  if (isMagicLinkCallback) {
    // Bypass session validation for magic link processing
    return addSecurityHeaders(NextResponse.next());
  }

  // Retrieve user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Validate the session
  const result = await ensureValidSession();

  if (!result && user) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.headers.set("x-session-checked", "true");
    return addSecurityHeaders(response);
  }

  // Define public and private routes
  const publicRoutes = [
    "/login",
    "/register",
    "/api/auth",
    "/api/health",
    "/auth/callback",
  ];
  const privateRoutes = [
    "/",
    "/dashboard",
    "/api/auth",
    "/admin/*",
    "/api/health",
  ];
  const currentPath = request.nextUrl.pathname;

  // Handle routing based on user session
  if (!user) {
    if (publicRoutes.some((route) => currentPath.startsWith(route))) {
      return addSecurityHeaders(NextResponse.next());
    }

    if (privateRoutes.some((route) => currentPath.startsWith(route))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      const response = NextResponse.redirect(loginUrl);
      response.headers.set("x-session-checked", "true");
      return addSecurityHeaders(response);
    }
  }

  if (user) {
    if (publicRoutes.some((route) => currentPath.startsWith(route))) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      const response = NextResponse.redirect(homeUrl);
      response.headers.set("x-session-checked", "true");
      return addSecurityHeaders(response);
    }
  }

  // Set session validation header
  const response = NextResponse.next();
  response.headers.set("x-session-checked", "true");
  return addSecurityHeaders(response);
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  return response;
}
