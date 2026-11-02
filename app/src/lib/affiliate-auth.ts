import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSessionCookieDomain } from "@/lib/auth";

export interface AffiliateSessionPayload {
  affiliateId: string;
  email: string;
  fullName: string;
  code: string;
}

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  "sf_jwt_secret_production_key_b2b_saas_987654321";

const secretKey = new TextEncoder().encode(JWT_SECRET);

export const AFFILIATE_SESSION_COOKIE = "sf_affiliate_session";

/**
 * Signs and creates a JWT session token for an Affiliate valid for 30 days
 */
export async function createAffiliateSessionToken(
  payload: AffiliateSessionPayload
): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

/**
 * Verifies an Affiliate JWT session token
 */
export async function verifyAffiliateSessionToken(
  token: string
): Promise<AffiliateSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as AffiliateSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the current Affiliate session from cookies
 */
export async function getAffiliateSession(): Promise<AffiliateSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AFFILIATE_SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifyAffiliateSessionToken(token);
}

/**
 * Sets the affiliate session cookie on the response
 */
export async function setAffiliateSessionCookie(token: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  const domain = getSessionCookieDomain();

  cookieStore.set(AFFILIATE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    domain,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clears the affiliate session cookie
 */
export async function clearAffiliateSessionCookie() {
  const cookieStore = await cookies();
  const domain = getSessionCookieDomain();

  cookieStore.set(AFFILIATE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain,
    maxAge: 0,
  });
}
