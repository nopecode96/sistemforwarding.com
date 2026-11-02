"use server";

import prisma from "@/lib/prisma";
import {
  getCurrentSession,
  createSessionToken,
  setSessionCookie,
  SessionPayload,
} from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface RecordAuditLogParams {
  operatorId?: string | null;
  operatorName?: string;
  operatorEmail?: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  details?: Record<string, unknown> | Prisma.InputJsonValue | unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface GetAuditLogsParams {
  query?: string;
  action?: string;
  targetType?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogItem {
  id: string;
  operatorId: string | null;
  operatorName: string;
  operatorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetName: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditTelemetrySummary {
  totalLogs: number;
  impersonationCount: number;
  securityCount: number;
  billingCount: number;
}

export interface GetAuditLogsResponse {
  logs: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: AuditTelemetrySummary;
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore when called outside Next.js request lifecycle
  }
}

async function getSafeRequestMetadata(): Promise<{
  host: string;
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const headerList = await headers();
    const forwardedHost = headerList.get("x-forwarded-host");
    const host = forwardedHost || headerList.get("host") || "";
    const forwarded = headerList.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0].trim()
      : headerList.get("x-real-ip") || headerList.get("cf-connecting-ip") || null;
    const userAgent = headerList.get("user-agent") || null;
    return { host, ipAddress, userAgent };
  } catch {
    return { host: "", ipAddress: null, userAgent: null };
  }
}

/**
 * Enforces Super Administrator session boundary.
 */
async function requireSuperAdmin() {
  if (process.env.ADMIN_TEST_MODE === "true") {
    return {
      userId: "test-superadmin-id",
      email: "superadmin@sistemforwarding.com",
      name: "Test SuperAdmin",
      role: "SUPERADMIN" as const,
      tenantId: null,
      subdomain: null,
    };
  }
  const session = await getCurrentSession();
  if (!session || (session.role !== "SUPERADMIN" && !session.originalSuperAdmin)) {
    throw new Error(
      "Akses ditolak: Operasi ini membutuhkan hak istimewa Super Administrator."
    );
  }
  return session;
}

/**
 * Robust helper function to record platform audit activities.
 * Safely resolves operator and request metadata with automatic fallbacks.
 */
export async function recordAuditLog(params: RecordAuditLogParams) {
  try {
    const meta = await getSafeRequestMetadata();

    let operatorId = params.operatorId ?? null;
    let operatorName = params.operatorName ?? "";
    let operatorEmail = params.operatorEmail ?? "";

    if (!operatorEmail || !operatorName) {
      const session = await getCurrentSession();
      if (session) {
        operatorId =
          params.operatorId ??
          session.originalSuperAdmin?.userId ??
          session.userId;
        operatorName =
          params.operatorName ??
          session.originalSuperAdmin?.name ??
          session.name;
        operatorEmail =
          params.operatorEmail ??
          session.originalSuperAdmin?.email ??
          session.email;
      } else if (process.env.ADMIN_TEST_MODE === "true") {
        operatorId = operatorId ?? "test-superadmin-id";
        operatorName = operatorName || "Test SuperAdmin";
        operatorEmail = operatorEmail || "superadmin@sistemforwarding.com";
      } else {
        operatorId = operatorId ?? null;
        operatorName = operatorName || "System Operator";
        operatorEmail = operatorEmail || "system@sistemforwarding.com";
      }
    }

    const ipAddress = params.ipAddress ?? meta.ipAddress;
    const userAgent = params.userAgent ?? meta.userAgent;

    // Sanitize details for JSON insertion
    let serializedDetails: Prisma.InputJsonValue | undefined = undefined;
    if (params.details !== undefined && params.details !== null) {
      try {
        serializedDetails = JSON.parse(JSON.stringify(params.details));
      } catch {
        serializedDetails = { note: String(params.details) };
      }
    }

    const log = await prisma.platformAuditLog.create({
      data: {
        operatorId,
        operatorName,
        operatorEmail,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        targetName: params.targetName ?? null,
        details: serializedDetails,
        ipAddress,
        userAgent,
      },
    });

    safeRevalidate("/admin/audit");
    safeRevalidate("/audit");

    return log;
  } catch (error) {
    // Non-blocking error handling so primary mutations never fail if audit logging encounters an issue
    console.warn("[PlatformAuditLog] Error recording audit log:", error);
    return null;
  }
}

/**
 * Server Action: Query platform audit logs with full-text search, action filtering,
 * target categorization, and pagination.
 */
export async function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<GetAuditLogsResponse> {
  await requireSuperAdmin();

  const {
    query,
    action,
    targetType,
    page = 1,
    pageSize = 20,
    startDate,
    endDate,
  } = params;

  const currentPage = Math.max(1, page);
  const take = Math.min(100, Math.max(1, pageSize));
  const skip = (currentPage - 1) * take;

  const where: Prisma.PlatformAuditLogWhereInput = {};

  if (query && query.trim() !== "") {
    const q = query.trim();
    where.OR = [
      { operatorName: { contains: q, mode: "insensitive" } },
      { operatorEmail: { contains: q, mode: "insensitive" } },
      { targetName: { contains: q, mode: "insensitive" } },
      { targetId: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
    ];
  }

  if (action && action !== "ALL") {
    if (action === "IMPERSONATION") {
      where.action = { in: ["IMPERSONATE_START", "IMPERSONATE_STOP"] };
    } else if (action === "SECURITY") {
      where.action = {
        in: [
          "TENANT_SUSPEND",
          "TENANT_ACTIVATE",
          "TENANT_PASSWORD_RESET",
          "TENANT_PROFILE_UPDATE",
          "ADMIN_LOGIN",
          "ADMIN_LOGOUT",
        ],
      };
    } else if (action === "BILLING") {
      where.action = {
        in: [
          "INVOICE_PAID_MANUAL",
          "INVOICE_CANCEL",
          "INVOICE_GENERATE",
          "PLAN_UPSERT",
          "PLAN_TOGGLE",
          "PLAN_DELETE",
          "BORDERPAY_RECONCILE",
        ],
      };
    } else {
      where.action = action;
    }
  }

  if (targetType && targetType !== "ALL") {
    where.targetType = targetType;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [rawLogs, total, totalLogs, impersonationCount, securityCount, billingCount] =
    await Promise.all([
      prisma.platformAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.platformAuditLog.count({ where }),
      prisma.platformAuditLog.count(),
      prisma.platformAuditLog.count({
        where: { action: { in: ["IMPERSONATE_START", "IMPERSONATE_STOP"] } },
      }),
      prisma.platformAuditLog.count({
        where: {
          action: {
            in: [
              "TENANT_SUSPEND",
              "TENANT_ACTIVATE",
              "TENANT_PASSWORD_RESET",
              "TENANT_PROFILE_UPDATE",
              "ADMIN_LOGIN",
              "ADMIN_LOGOUT",
            ],
          },
        },
      }),
      prisma.platformAuditLog.count({
        where: {
          OR: [
            { targetType: { in: ["INVOICE", "PLAN"] } },
            {
              action: {
                in: [
                  "INVOICE_PAID_MANUAL",
                  "INVOICE_CANCEL",
                  "INVOICE_GENERATE",
                  "PLAN_UPSERT",
                  "PLAN_TOGGLE",
                  "PLAN_DELETE",
                  "BORDERPAY_RECONCILE",
                ],
              },
            },
          ],
        },
      }),
    ]);

  const logs: AuditLogItem[] = rawLogs.map((item) => ({
    id: item.id,
    operatorId: item.operatorId,
    operatorName: item.operatorName,
    operatorEmail: item.operatorEmail,
    action: item.action,
    targetType: item.targetType,
    targetId: item.targetId,
    targetName: item.targetName,
    details: item.details,
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
    createdAt: item.createdAt.toISOString(),
  }));

  const totalPages = Math.ceil(total / take) || 1;

  return {
    logs,
    total,
    page: currentPage,
    pageSize: take,
    totalPages,
    summary: {
      totalLogs,
      impersonationCount,
      securityCount,
      billingCount,
    },
  };
}

/**
 * Server Action: Start Impersonating a Tenant Workspace ("Login as Tenant")
 * Creates a delegated session token while preserving original Super Admin operator identity.
 */
export async function startTenantImpersonation(tenantId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  redirectUrl?: string;
  subdomain?: string;
  tenantId?: string;
}> {
  try {
    const callerSession = await requireSuperAdmin();

    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: tenantId }, { subdomain: tenantId }],
      },
      include: {
        users: {
          where: { isActive: true },
          orderBy: [{ role: "asc" }, { createdAt: "asc" }],
          take: 1,
        },
      },
    });

    if (!tenant) {
      return {
        success: false,
        error: "Ruang kerja tenant tidak ditemukan.",
      };
    }

    const originalSuperAdmin = callerSession.originalSuperAdmin || {
      userId: callerSession.userId,
      name: callerSession.name,
      email: callerSession.email,
    };

    const tenantUser = tenant.users[0];

    const impersonatedPayload: SessionPayload = {
      userId: tenantUser?.id || callerSession.userId,
      email: tenantUser?.email || callerSession.email,
      name: tenantUser?.name || callerSession.name,
      role: "SUPERADMIN",
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      companyName: tenant.companyName,
      isImpersonating: true,
      originalSuperAdmin: {
        userId: originalSuperAdmin.userId,
        name: originalSuperAdmin.name,
        email: originalSuperAdmin.email,
      },
    };

    const sessionToken = await createSessionToken(impersonatedPayload);
    const meta = await getSafeRequestMetadata();
    await setSessionCookie(sessionToken, meta.host);

    await recordAuditLog({
      operatorId: originalSuperAdmin.userId,
      operatorName: originalSuperAdmin.name,
      operatorEmail: originalSuperAdmin.email,
      action: "IMPERSONATE_START",
      targetType: "TENANT",
      targetId: tenant.id,
      targetName: tenant.companyName,
      details: {
        subdomain: tenant.subdomain,
        impersonatedUser: tenantUser?.email || "Platform SuperAdmin",
      },
    });

    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "sistemforwarding.com";
    const host = meta.host.split(":")[0].toLowerCase();
    const port = meta.host.includes(":") ? `:${meta.host.split(":")[1]}` : "";

    let redirectUrl = `https://${tenant.subdomain}.${ROOT_DOMAIN}/`;
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
      redirectUrl = `http://${tenant.subdomain}.localhost${port}/`;
    }

    if (process.env.ADMIN_TEST_MODE === "true") {
      process.env.ADMIN_TEST_MODE_IMPERSONATING = "true";
      process.env.ADMIN_TEST_MODE_TENANT_ID = tenant.id;
      process.env.ADMIN_TEST_MODE_TENANT_NAME = tenant.companyName;
      process.env.ADMIN_TEST_MODE_SUBDOMAIN = tenant.subdomain;
    }

    return {
      success: true,
      message: `Berhasil memulai sesi impersonasi untuk ${tenant.companyName}.`,
      redirectUrl,
      subdomain: tenant.subdomain,
      tenantId: tenant.id,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[startTenantImpersonation Error]", err);
    return {
      success: false,
      error: err.message || "Gagal memulai sesi impersonasi tenant.",
    };
  }
}

/**
 * Server Action: Stop Impersonating and Restore Original Super Admin Session
 */
export async function stopTenantImpersonation(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  redirectUrl?: string;
}> {
  try {
    const session = await getCurrentSession();

    const isImpersonating =
      session?.isImpersonating ||
      !!session?.originalSuperAdmin ||
      (process.env.ADMIN_TEST_MODE === "true" &&
        process.env.ADMIN_TEST_MODE_IMPERSONATING === "true");

    if (!isImpersonating) {
      return {
        success: false,
        error: "Sesi Anda saat ini tidak sedang dalam mode impersonasi.",
      };
    }

    const superAdminData = session?.originalSuperAdmin || {
      userId: session?.userId || "test-superadmin-id",
      name: session?.name || "Test SuperAdmin",
      email: session?.email || "superadmin@sistemforwarding.com",
    };

    const targetTenantId =
      session?.tenantId ||
      (process.env.ADMIN_TEST_MODE === "true"
        ? process.env.ADMIN_TEST_MODE_TENANT_ID || null
        : null);
    const targetTenantName =
      session?.companyName ||
      (process.env.ADMIN_TEST_MODE === "true"
        ? process.env.ADMIN_TEST_MODE_TENANT_NAME || null
        : null);
    const targetSubdomain =
      session?.subdomain ||
      (process.env.ADMIN_TEST_MODE === "true"
        ? process.env.ADMIN_TEST_MODE_SUBDOMAIN || null
        : null);

    if (process.env.ADMIN_TEST_MODE === "true") {
      delete process.env.ADMIN_TEST_MODE_IMPERSONATING;
      delete process.env.ADMIN_TEST_MODE_TENANT_ID;
      delete process.env.ADMIN_TEST_MODE_TENANT_NAME;
      delete process.env.ADMIN_TEST_MODE_SUBDOMAIN;
    }

    await recordAuditLog({
      operatorId: superAdminData.userId,
      operatorName: superAdminData.name,
      operatorEmail: superAdminData.email,
      action: "IMPERSONATE_STOP",
      targetType: "TENANT",
      targetId: targetTenantId,
      targetName: targetTenantName,
      details: {
        subdomain: targetSubdomain,
      },
    });

    const restoredPayload: SessionPayload = {
      userId: superAdminData.userId,
      email: superAdminData.email,
      name: superAdminData.name,
      role: "SUPERADMIN",
      tenantId: null,
      subdomain: null,
      companyName: "Global Super Administrator",
      isImpersonating: false,
    };

    const sessionToken = await createSessionToken(restoredPayload);
    const meta = await getSafeRequestMetadata();
    await setSessionCookie(sessionToken, meta.host);

    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "sistemforwarding.com";
    const host = meta.host.split(":")[0].toLowerCase();
    const port = meta.host.includes(":") ? `:${meta.host.split(":")[1]}` : "";
    const tenantParam = targetTenantId ? `/${targetTenantId}` : "";

    let redirectUrl = `https://admin.${ROOT_DOMAIN}/tenants${tenantParam}`;
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
      redirectUrl = `http://admin.localhost${port}/tenants${tenantParam}`;
    }

    return {
      success: true,
      message: "Sesi impersonasi dihentikan. Anda kembali sebagai Super Administrator.",
      redirectUrl,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[stopTenantImpersonation Error]", err);
    return {
      success: false,
      error: err.message || "Gagal menghentikan impersonasi.",
    };
  }
}
