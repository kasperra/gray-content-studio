import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/admin", "/portal", "/review"];

/** The diagnostic is served from its own subdomain but lives in this app under
    /diagnostic. Requests to that host are rewritten so the visitor sees clean
    URLs (diagnostic.graycontentstudio.co/results/abc) while Next routes them to
    the real segment. */
function diagnosticRewrite(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  if (!host.startsWith("diagnostic.")) return null;

  const { pathname } = request.nextUrl;
  // Already-correct paths and framework assets pass through untouched.
  if (pathname.startsWith("/diagnostic") || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/diagnostic" : `/diagnostic${pathname}`;
  return NextResponse.rewrite(url);
}

export default async function proxy(request: NextRequest) {
  const rewrite = diagnosticRewrite(request);
  if (rewrite) return rewrite;

  const needsAuth = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));

  // Supabase not configured yet → route to setup notice instead of crashing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (needsAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("setup", "1");
      return request.nextUrl.pathname === "/login" ? NextResponse.next() : NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session (required for SSR auth) and gate protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
    "/review/:path*",
    "/login",
    /* Everything else, so the diagnostic subdomain can be rewritten. Static
       assets and image requests are excluded to keep this off the hot path. */
    "/((?!_next/static|_next/image|img/|video/|favicon|icon|apple-icon|robots.txt|sitemap.xml).*)",
  ],
};
