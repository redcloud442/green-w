import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const cookieStore = await cookies();
  // Check if the session validation has already occurred
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
              cookieStore.set(name, value, { ...options, sameSite: true })
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
    return addSecurityHeaders(NextResponse.next());
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicRoutes = [
    "/login",
    "/register/*",
    "/api/v1/auth",
    "/loginSecured",
    "/api/health",
    "/",
    "/faq",
    "/proof-and-legalities",
  ];
  const privateRoutes = ["/panel", "/api/auth", "/admin", "/"];
  const currentPath = request.nextUrl.pathname;

  if (!user) {
    // 🔹 If user is NOT logged in and they visit a public route, let them pass
    if (publicRoutes.some((route) => currentPath.startsWith(route))) {
      return addSecurityHeaders(NextResponse.next());
    }

    // 🔹 If user is NOT logged in and tries to access private routes, redirect to login
    if (privateRoutes.some((route) => currentPath.startsWith(route))) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  } else {
    // 🔹 If user is logged in and visits login/register, send them to /dashboard
    if (publicRoutes.includes(currentPath)) {
      if (currentPath !== "/panel") {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = "/panel";
        return addSecurityHeaders(NextResponse.redirect(homeUrl));
      }
    }

    // 🔹 If user is logged in and visits a private route, let them pass
    if (privateRoutes.some((route) => currentPath.startsWith(route))) {
      return addSecurityHeaders(NextResponse.next());
    }
  }

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
