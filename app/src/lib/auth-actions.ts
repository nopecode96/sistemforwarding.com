"use server";

import prisma from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getCurrentSession,
} from "@/lib/auth";
import { recordAuditLog } from "@/actions/adminAuditActions";
import { headers } from "next/headers";

async function getSafeHostHeader(): Promise<string> {
  try {
    const headerList = await headers();
    return headerList.get("host") || "";
  } catch {
    return "";
  }
}

/**
 * Server Action for Tenant Client Login (e.g. demo1.sistemforwarding.com/login)
 */
export async function loginTenantAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const targetSubdomain = (formData.get("subdomain") as string)?.trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email perusahaan wajib diisi." };
  }

  try {
    const hostHeader = await getSafeHostHeader();

    // 1. Look up user by email with tenant relation
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return {
        success: false,
        error: "Kredensial tidak ditemukan. Pastikan akun email Anda sudah terdaftar dalam sistem tenant.",
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: "Akun Anda berstatus nonaktif. Silakan hubungi Administrator Perusahaan Anda.",
      };
    }

    // 1.1 Tenant suspension verification (Superadmin can bypass to audit)
    if (
      user.role !== "SUPERADMIN" &&
      user.tenant &&
      (!user.tenant.isActive || user.tenant.subscriptionStatus === "SUSPENDED")
    ) {
      return {
        success: false,
        error: "Ruang kerja tenant ini sedang ditangguhkan (SUSPENDED). Silakan hubungi Super Administrator platform.",
      };
    }

    // 1.2 Password verification if passwordHash is established
    const password = (formData.get("password") as string)?.trim();
    if (user.passwordHash) {
      if (!password || user.passwordHash !== password) {
        return {
          success: false,
          error: "Kata sandi yang Anda masukkan salah.",
        };
      }
    }

    // 2. Validate tenant workspace match
    // Superadmin has universal access to all tenants. Regular users must match the subdomain.
    if (targetSubdomain && user.role !== "SUPERADMIN") {
      if (!user.tenant || user.tenant.subdomain !== targetSubdomain) {
        return {
          success: false,
          error: `Akun ini terdaftar di ruang kerja ${user.tenant?.companyName || "perusahaan lain"}. Silakan login melalui portal ruang kerja Anda.`,
        };
      }
    }

    // 3. Create Session Token (7 days)
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as import("@/lib/auth").SessionPayload["role"],
      tenantId: user.tenantId,
      subdomain: user.tenant?.subdomain || targetSubdomain || null,
      companyName: user.tenant?.companyName || null,
    });

    // 4. Set Wildcard HttpOnly Cookie (.sistemforwarding.com)
    await setSessionCookie(sessionToken, hostHeader);

    return {
      success: true,
      redirectUrl: "/",
    };
  } catch (error) {
    console.error("[Tenant Login Action Error]", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat memproses login. Silakan coba kembali.",
    };
  }
}

/**
 * Server Action for Super Admin Login (admin.sistemforwarding.com/login)
 */
export async function loginAdminAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { success: false, error: "Email administrator wajib diisi." };
  }

  try {
    const hostHeader = await getSafeHostHeader();

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user || user.role !== "SUPERADMIN") {
      return {
        success: false,
        error: "Akses ditolak. Kredensial ini bukan akun Super Administrator platform.",
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: "Akun administrator Anda berstatus nonaktif.",
      };
    }

    const password = (formData.get("password") as string)?.trim();
    if (user.passwordHash) {
      if (!password || user.passwordHash !== password) {
        return {
          success: false,
          error: "Kata sandi administrator salah.",
        };
      }
    }

    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: "SUPERADMIN",
      tenantId: null,
      subdomain: null,
      companyName: "Global Super Administrator",
    });

    await setSessionCookie(sessionToken, hostHeader);

    await recordAuditLog({
      operatorId: user.id,
      operatorName: user.name,
      operatorEmail: user.email,
      action: "ADMIN_LOGIN",
      targetType: "AUTH",
      targetId: user.id,
      targetName: user.name,
      details: { email: user.email, role: user.role },
    });

    return {
      success: true,
      redirectUrl: "/",
    };
  } catch (error) {
    console.error("[Admin Login Action Error]", error);
    return {
      success: false,
      error: "Terjadi gangguan sistem saat otentikasi administrator.",
    };
  }
}

/**
 * Server Action for Logout across all portals
 */
export async function logoutAction() {
  const hostHeader = await getSafeHostHeader();
  const session = await getCurrentSession();

  if (session && session.role === "SUPERADMIN") {
    await recordAuditLog({
      operatorId: session.userId,
      operatorName: session.name,
      operatorEmail: session.email,
      action: "ADMIN_LOGOUT",
      targetType: "AUTH",
      targetId: session.userId,
      targetName: session.name,
      details: { email: session.email },
    });
  }

  await clearSessionCookie(hostHeader);
  return { success: true };
}
