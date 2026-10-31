import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host") || "sistemforwarding.com";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const proto = isLocal ? "http" : "https";

  // Build clean canonical redirect URL back to the tenant or admin login portal
  const redirectTarget = req.nextUrl.searchParams.get("redirect") || "/login";
  const loginUrl = new URL(redirectTarget, `${proto}://${host}`);

  const response = NextResponse.redirect(loginUrl);

  const cleanHost = host.split(":")[0];
  const isProd = cleanHost.includes("sistemforwarding.com");
  const secureFlag = isLocal ? "" : "; Secure";

  // Explicitly clear across wildcard domain, specific host, and host-only cookies
  const cookieHeaders = [
    `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`,
    `${SESSION_COOKIE_NAME}=; Path=/; Domain=${cleanHost}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`,
  ];

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
    `${SESSION_COOKIE_NAME}=; Path=/; Domain=${cleanHost}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureFlag}`,
  ];

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
