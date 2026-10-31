import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

// Root apex domain from environment or default fallback
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "sistemforwarding.com";

/**
 * Extracts and normalizes the tenant subdomain from the Host header.
 * Handles production domains (*.sistemforwarding.com), local development (*.localhost),
 * and ignores www/apex/IP addresses.
 */
export function extractSubdomain(hostHeader: string | null): string | null {
  if (!hostHeader) return null;

  // Strip port number if present (e.g., localhost:3000 -> localhost)
  const host = hostHeader.split(":")[0].toLowerCase();
  const normalizedRoot = ROOT_DOMAIN.toLowerCase().split(":")[0];

  // 1. Localhost development support (e.g., acme.localhost, admin.localhost)
  if (host.endsWith(".localhost")) {
    const sub = host.replace(".localhost", "");
    return sub === "www" ? null : sub;
  }
  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  // 2. Production apex & www support
  if (host === normalizedRoot || host === `www.${normalizedRoot}`) {
    return null;
  }

  // 3. Subdomain extraction for *.sistemforwarding.com
  if (host.endsWith(`.${normalizedRoot}`)) {
    const sub = host.slice(0, -(normalizedRoot.length + 1));
    return sub === "www" ? null : sub;
  }

  return null;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";
  const pathname = url.pathname;

  // Ignore internal Next.js assets, static files, and API routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const subdomain = extractSubdomain(host);

  // Read and verify HttpOnly Session Cookie (jose edge-compatible)
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // Clone incoming request headers so downstream server components can access tenant metadata
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", req.url);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-is-login", pathname === "/login" ? "1" : "0");

  // ============================================================================
  // CASE 1: Super Admin Portal (admin.sistemforwarding.com)
  // ============================================================================
  if (subdomain === "admin") {
    const isSuperAdmin = session && session.role === "SUPERADMIN";

    // 1.1 Accessing /login on admin subdomain
    if (pathname === "/login") {
      if (isSuperAdmin) {
        // Already logged in as Super Admin -> redirect to root dashboard
        return NextResponse.redirect(new URL("/", req.url));
      }
      // Render Super Admin Login Page
      requestHeaders.set("x-portal-type", "admin-login");
      return NextResponse.rewrite(new URL("/admin/login", req.url), {
        request: { headers: requestHeaders },
      });
    }

    // 1.2 Accessing any protected admin dashboard route
    if (!isSuperAdmin) {
      // Unauthenticated or regular tenant user -> redirect to admin /login
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Authenticated Super Admin -> rewrite to /admin/...
    requestHeaders.set("x-portal-type", "admin");
    return NextResponse.rewrite(
      new URL(`/admin${pathname === "/" ? "" : pathname}`, req.url),
      {
        request: { headers: requestHeaders },
      }
    );
  }

  // ============================================================================
  // CASE 2: Tenant Operational Client Console ([subdomain].sistemforwarding.com)
  // ============================================================================
  if (subdomain) {
    // 2.0 Canonical Clean URL: If requested path redundantly includes /${subdomain}, redirect to clean path
    if (pathname === `/${subdomain}` || pathname.startsWith(`/${subdomain}/`)) {
      const cleanPath = pathname.slice(subdomain.length + 1) || "/";
      const cleanUrl = new URL(cleanPath, req.url);
      cleanUrl.search = url.search;
      return NextResponse.redirect(cleanUrl);
    }

    // Authorized if user is SUPERADMIN or user's tenant subdomain matches this subdomain
    const isAuthorized =
      session &&
      (session.role === "SUPERADMIN" || session.subdomain === subdomain);

    // 2.1 Accessing /login on tenant subdomain
    if (pathname === "/login") {
      if (isAuthorized) {
        // Already logged in for this tenant -> redirect to tenant root dashboard
        return NextResponse.redirect(new URL("/", req.url));
      }
      // Render White-Label Tenant Login Page
      requestHeaders.set("x-portal-type", "tenant-login");
      requestHeaders.set("x-tenant-subdomain", subdomain);
      return NextResponse.rewrite(new URL(`/${subdomain}/login`, req.url), {
        request: { headers: requestHeaders },
      });
    }

    // 2.2 Accessing protected tenant operational workspace
    if (!isAuthorized) {
      // Not logged in or unauthorized tenant session -> redirect to tenant /login
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Authenticated -> rewrite to /[tenant]/...
    requestHeaders.set("x-portal-type", "tenant");
    requestHeaders.set("x-tenant-subdomain", subdomain);
    return NextResponse.rewrite(
      new URL(`/${subdomain}${pathname === "/" ? "" : pathname}`, req.url),
      {
        request: { headers: requestHeaders },
      }
    );
  }

  // ============================================================================
  // CASE 3: Public Landing Page, Onboarding & Auth Portal (sistemforwarding.com)
  // ============================================================================
  const isProduction = host.includes("sistemforwarding.com");

  // Canonical redirect for /admin and demo tenants if accessed on apex in production
  if (isProduction) {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const rest = pathname.replace(/^\/admin/, "") || "/";
      return NextResponse.redirect(new URL(`https://admin.${ROOT_DOMAIN}${rest}`));
    }

    if (pathname.startsWith("/demo1")) {
      const rest = pathname.replace(/^\/demo1/, "") || "/";
      return NextResponse.redirect(new URL(`https://demo1.${ROOT_DOMAIN}${rest}`));
    }

    if (pathname.startsWith("/demo2")) {
      const rest = pathname.replace(/^\/demo2/, "") || "/";
      return NextResponse.redirect(new URL(`https://demo2.${ROOT_DOMAIN}${rest}`));
    }
  }

  requestHeaders.set("x-portal-type", "public");
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (public assets folder)
     * 4. Static files (e.g. favicon.ico, images, fonts, robots.txt)
     */
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
};
