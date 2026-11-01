import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

/**
 * Prevents CWE-601 open redirect vulnerabilities.
 * Allows only safe relative URL paths starting with a single '/' (e.g. '/login', '/admin/login').
 * Blocks absolute URLs, protocol-relative '//', and Windows backslash paths.
 */
export function sanitizeRedirect(target: string | null, defaultTarget = "/login"): string {
  if (!target || typeof target !== "string") return defaultTarget;
  const trimmed = target.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\")
  ) {
    return defaultTarget;
  }
  return trimmed;
}

export async function GET(req: NextRequest) {
  // CRITICAL: Prevent prefetch from destroying user session!
  // Next.js Link prefetching or browser speculative prerendering should never destroy cookies
  const isPrefetch =
    req.headers.get("purpose") === "prefetch" ||
    req.headers.get("x-purpose") === "prefetch" ||
    req.headers.get("sec-purpose") === "prefetch" ||
    req.headers.get("next-router-prefetch") !== null ||
    req.nextUrl.searchParams.has("_rsc");

  if (isPrefetch) {
    return new NextResponse(null, { status: 204 });
  }

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host") || "sistemforwarding.com";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const proto = isLocal ? "http" : "https";

  // Build clean canonical redirect URL back to the tenant or admin login portal
  const rawTarget = req.nextUrl.searchParams.get("redirect");
  const redirectTarget = sanitizeRedirect(rawTarget, "/login");
  const loginUrl = new URL(redirectTarget, `${proto}://${host}`);

  const response = NextResponse.redirect(loginUrl);

  const cleanHost = host.split(":")[0];
  const isProd = cleanHost.includes("sistemforwarding.com");
  const secureFlag = isLocal ? "" : "; Secure";

  // Explicitly clear across host-only, host-domain (prod/staging non-local), and wildcard domain
  const cookieHeaders = [
    `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`,
  ];

  if (!isLocal) {
    cookieHeaders.push(
      `${SESSION_COOKIE_NAME}=; Path=/; Domain=${cleanHost}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`
    );
  }

  if (isProd) {
    cookieHeaders.push(
      `${SESSION_COOKIE_NAME}=; Path=/; Domain=.sistemforwarding.com; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`
    );
  }

  for (const c of cookieHeaders) {
    response.headers.append("Set-Cookie", c);
  }

  return response;
}

export async function POST(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host") || "sistemforwarding.com";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  const cleanHost = host.split(":")[0];
  const isProd = cleanHost.includes("sistemforwarding.com");
  const secureFlag = isLocal ? "" : "; Secure";

  const cookieHeaders = [
    `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`,
  ];

  if (!isLocal) {
    cookieHeaders.push(
      `${SESSION_COOKIE_NAME}=; Path=/; Domain=${cleanHost}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`
    );
  }

  if (isProd) {
    cookieHeaders.push(
      `${SESSION_COOKIE_NAME}=; Path=/; Domain=.sistemforwarding.com; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`
    );
  }

  for (const c of cookieHeaders) {
    response.headers.append("Set-Cookie", c);
  }

  return response;
}
