import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const cookieStore = await cookies();

  if (request.headers.get("x-session-checked")) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (request.nextUrl.pathname.startsWith("/api/v1/auth/register")) {
    return NextResponse.next();
  }

  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
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

  // Define public and private routes
  const publicRoutes = [
    "/login",
    "/register",
    "/api/auth",
    "/api/health",
    "/api/v1/auth",
    "/auth/callback",
    "/loginSecured",
  ];
  const privateRoutes = [
    "/*",
    "/dashboard",
    "/api/auth",
    "/admin/*",
    "/loginSecured",
    "/api/health",
    "/client",
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
  supabaseResponse.headers.set("x-session-checked", "true");
  return addSecurityHeaders(supabaseResponse);
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  return response;
}
