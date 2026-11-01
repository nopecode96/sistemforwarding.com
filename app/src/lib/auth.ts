import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "SUPERADMIN" | "TENANT_ADMIN" | "OPERATOR" | "FINANCE" | "MANAGEMENT";
  tenantId: string | null;
  subdomain: string | null;
  companyName?: string | null;
  isImpersonating?: boolean;
  originalSuperAdmin?: {
    userId: string;
    name: string;
    email: string;
  };
}

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  "sf_jwt_secret_production_key_b2b_saas_987654321";

const secretKey = new TextEncoder().encode(JWT_SECRET);

export const SESSION_COOKIE_NAME = "sf_session";

/**
 * Returns wildcard domain for cookies so sessions are shared across *.sistemforwarding.com.
 * For local development or preview environments, returns undefined so browser binds to current host.
 */
export function getSessionCookieDomain(hostHeader?: string | null): string | undefined {
  if (!hostHeader) {
    return process.env.NODE_ENV === "production" ? ".sistemforwarding.com" : undefined;
  }
  const host = hostHeader.split(":")[0].toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
    return undefined;
  }
  if (host.endsWith("sistemforwarding.com")) {
    return ".sistemforwarding.com";
  }
  return undefined;
}

/**
 * Signs and creates a JWT session token valid for 7 days
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/**
 * Verifies a JWT session token and returns the payload if valid
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Sets the HttpOnly session cookie on the Next.js response headers with 7 days expiry.
 */
export async function setSessionCookie(token: string, hostHeader?: string | null) {
  try {
    const cookieStore = await cookies();
    const domain = getSessionCookieDomain(hostHeader);

    // If wildcard domain is specified, also clear host-bound cookie to avoid shadowing
    if (domain) {
      cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production",
      });
    }

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      domain: domain || undefined,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    // Graceful fallback outside request lifecycle (e.g. CLI tests)
  }
}

export { getUserInitials } from "./auth-utils";

/**
 * Clears the session cookie across the entire wildcard domain and host.
 */
export async function clearSessionCookie(hostHeader?: string | null) {
  try {
    const cookieStore = await cookies();
    const domain = getSessionCookieDomain(hostHeader);

    // 1. Explicitly clear wildcard domain cookie if applicable
    if (domain) {
      cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: domain,
        maxAge: 0,
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production",
      });
    }

    // 2. Clear host-specific cookie (bound to current host without wildcard domain)
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
    });

    // 3. Fallback standard delete
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Graceful fallback outside request lifecycle (e.g. CLI tests)
  }
}

/**
 * Reads and verifies the current session from incoming cookies.
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;
    return await verifySessionToken(sessionCookie);
  } catch {
    return null;
  }
}
