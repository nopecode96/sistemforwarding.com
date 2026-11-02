"use server";

import prisma from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { headers } from "next/headers";

export interface LoginActionResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

/**
 * Server Action for Universal B2B Authentication (sistemforwarding.com/login).
 * Resolves user from PostgreSQL, writes wildcard session cookie, and directs
 * to the appropriate tenant workspace (https://[client].sistemforwarding.com)
 * or Super Admin Portal (https://admin.sistemforwarding.com).
 */
export async function authenticateUser(
  prevState: LoginActionResult | null,
  formData: FormData
): Promise<LoginActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return {
      success: false,
      error: "Email dan password wajib diisi.",
    };
  }

  try {
    const headerList = await headers();
    const hostHeader = headerList.get("host") || "";
    const isProduction = hostHeader.includes("sistemforwarding.com");

    // 1. Look up user in PostgreSQL database with tenant relation
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "Kredensial tidak valid. Akun Anda belum terdaftar dalam sistem tenant kami.",
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: "Akun Anda telah dinonaktifkan. Silakan hubungi Administrator Perusahaan Anda.",
      };
    }

    // Tenant workspace suspension guard
    if (
      user.role !== "SUPERADMIN" &&
      user.tenant &&
      (!user.tenant.isActive || user.tenant.subscriptionStatus === "SUSPENDED")
    ) {
      return {
        success: false,
        error: "Ruang kerja tenant ini sedang ditangguhkan (SUSPENDED). Silakan hubungi Super Administrator.",
      };
    }

    const password = (formData.get("password") as string)?.trim();
    if (user.passwordHash) {
      if (!password || user.passwordHash !== password) {
        return {
          success: false,
          error: "Kata sandi yang Anda masukkan tidak sesuai.",
        };
      }
    }

    // 2. Create Session Token (7 days)
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      tenantId: user.tenantId,
      subdomain: user.tenant?.subdomain || null,
      companyName: user.tenant?.companyName || null,
    });

    // 3. Set Wildcard HttpOnly Cookie (.sistemforwarding.com)
    await setSessionCookie(sessionToken, hostHeader);

    // 4. Super Admin Portal Routing
    if (user.role === "SUPERADMIN") {
      return {
        success: true,
        redirectUrl: isProduction
          ? "https://admin.sistemforwarding.com"
          : "/admin",
      };
    }

    // 5. Tenant Client Workspace Routing
    if (user.tenant?.subdomain) {
      return {
        success: true,
        redirectUrl: isProduction
          ? `https://${user.tenant.subdomain}.sistemforwarding.com`
          : `/${user.tenant.subdomain}`,
      };
    }

    // Default fallback
    return {
      success: true,
      redirectUrl: isProduction
        ? "https://demo1.sistemforwarding.com"
        : "/demo1",
    };
  } catch (error) {
    console.error("[Login Action] Database lookup failed:", error);
    return {
      success: false,
      error: "Terjadi kesalahan internal saat memverifikasi akun.",
    };
  }
}
