"use server";

import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { SubscriptionStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { recordAuditLog } from "./adminAuditActions";

export interface TenantAdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AdminTenantItem {
  id: string;
  subdomain: string;
  companyName: string;
  legalName: string | null;
  logoUrl: string | null;
  taxId: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionTier: string;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  billingCycle: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  primaryAdmin: TenantAdminUser | null;
  users: TenantAdminUser[];
  metrics: {
    totalUsers: number;
    jobFiles: number;
    invoices: number;
    vendors: number;
    customers: number;
  };
}

export interface AdminTelemetrySummary {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  expiredTenants: number;
  totalJobFiles: number;
  totalUsers: number;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Safely ignore when called outside Next.js request lifecycle (e.g. CLI tests)
  }
}

/**
 * Security boundary: Enforce Super Administrator session
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
  if (!session || session.role !== "SUPERADMIN") {
    throw new Error("Akses ditolak: Operasi ini membutuhkan hak istimewa Super Administrator.");
  }
  return session;
}

/**
 * Fetch all tenants and platform telemetry for Super Admin console
 */
export async function getAdminTenantsData(): Promise<{
  summary: AdminTelemetrySummary;
  tenants: AdminTenantItem[];
}> {
  await requireSuperAdmin();

  const [tenants, totalJobFiles, totalUsers] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        },
        _count: {
          select: {
            jobFiles: true,
            invoices: true,
            vendors: true,
            customers: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobFile.count(),
    prisma.user.count(),
  ]);

  let activeCount = 0;
  let trialCount = 0;
  let suspendedCount = 0;
  let expiredCount = 0;

  const mappedTenants: AdminTenantItem[] = tenants.map((t) => {
    if (!t.isActive || t.subscriptionStatus === SubscriptionStatus.SUSPENDED) {
      suspendedCount++;
    } else if (t.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      activeCount++;
    } else if (t.subscriptionStatus === SubscriptionStatus.TRIAL) {
      trialCount++;
    } else if (
      t.subscriptionStatus === SubscriptionStatus.EXPIRED ||
      t.subscriptionStatus === SubscriptionStatus.CANCELLED
    ) {
      expiredCount++;
    }

    const primaryAdminRecord =
      t.users.find((u) => u.role === UserRole.TENANT_ADMIN) || t.users[0] || null;

    const primaryAdmin: TenantAdminUser | null = primaryAdminRecord
      ? {
          id: primaryAdminRecord.id,
          name: primaryAdminRecord.name,
          email: primaryAdminRecord.email,
          phone: primaryAdminRecord.phone,
          role: primaryAdminRecord.role,
          isActive: primaryAdminRecord.isActive,
          createdAt: primaryAdminRecord.createdAt.toISOString(),
        }
      : null;

    const users: TenantAdminUser[] = t.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    }));

    const trialDaysRemaining = t.trialEndsAt
      ? Math.ceil((t.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: t.id,
      subdomain: t.subdomain,
      companyName: t.companyName,
      legalName: t.legalName,
      logoUrl: t.logoUrl,
      taxId: t.taxId,
      subscriptionStatus: t.subscriptionStatus,
      subscriptionTier: t.subscriptionTier,
      trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
      trialDaysRemaining,
      billingCycle: t.billingCycle,
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      primaryAdmin,
      users,
      metrics: {
        totalUsers: t._count.users,
        jobFiles: t._count.jobFiles,
        invoices: t._count.invoices,
        vendors: t._count.vendors,
        customers: t._count.customers,
      },
    };
  });

  const summary: AdminTelemetrySummary = {
    totalTenants: tenants.length,
    activeTenants: activeCount,
    trialTenants: trialCount,
    suspendedTenants: suspendedCount,
    expiredTenants: expiredCount,
    totalJobFiles,
    totalUsers,
  };

  return { summary, tenants: mappedTenants };
}

/**
 * Fetch detailed tenant by ID
 */
export async function getTenantDetailById(tenantId: string): Promise<AdminTenantItem | null> {
  await requireSuperAdmin();

  const t = await prisma.tenant.findFirst({
    where: {
      OR: [{ id: tenantId }, { subdomain: tenantId }],
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
      financialSettings: true,
      _count: {
        select: {
          jobFiles: true,
          invoices: true,
          vendors: true,
          customers: true,
          users: true,
        },
      },
    },
  });

  if (!t) return null;

  const primaryAdminRecord =
    t.users.find((u) => u.role === UserRole.TENANT_ADMIN) || t.users[0] || null;

  const primaryAdmin: TenantAdminUser | null = primaryAdminRecord
    ? {
        id: primaryAdminRecord.id,
        name: primaryAdminRecord.name,
        email: primaryAdminRecord.email,
        phone: primaryAdminRecord.phone,
        role: primaryAdminRecord.role,
        isActive: primaryAdminRecord.isActive,
        createdAt: primaryAdminRecord.createdAt.toISOString(),
      }
    : null;

  const users: TenantAdminUser[] = t.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }));

  const trialDaysRemaining = t.trialEndsAt
    ? Math.ceil((t.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    id: t.id,
    subdomain: t.subdomain,
    companyName: t.companyName,
    legalName: t.legalName,
    logoUrl: t.logoUrl,
    taxId: t.taxId,
    subscriptionStatus: t.subscriptionStatus,
    subscriptionTier: t.subscriptionTier,
    trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
    trialDaysRemaining,
    billingCycle: t.billingCycle,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    primaryAdmin,
    users,
    metrics: {
      totalUsers: t._count.users,
      jobFiles: t._count.jobFiles,
      invoices: t._count.invoices,
      vendors: t._count.vendors,
      customers: t._count.customers,
    },
  };
}

/**
 * Toggle Suspend / Activate Tenant
 */
export async function toggleTenantSuspension(
  tenantId: string,
  suspend: boolean,
  reason?: string
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, companyName: true, subdomain: true, subscriptionStatus: true },
    });

    if (!tenant) {
      return { success: false, error: "Tenant tidak ditemukan dalam sistem." };
    }

    const nextIsActive = !suspend;
    const nextStatus = suspend
      ? SubscriptionStatus.SUSPENDED
      : tenant.subscriptionStatus === SubscriptionStatus.SUSPENDED
      ? SubscriptionStatus.ACTIVE
      : tenant.subscriptionStatus;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isActive: nextIsActive,
        subscriptionStatus: nextStatus,
      },
    });

    await recordAuditLog({
      action: suspend ? "TENANT_SUSPEND" : "TENANT_ACTIVATE",
      targetType: "TENANT",
      targetId: tenant.id,
      targetName: tenant.companyName,
      details: {
        subdomain: tenant.subdomain,
        suspend,
        reason: reason?.trim() || null,
        status: nextStatus,
      },
    });

    safeRevalidate("/admin");
    safeRevalidate("/admin/tenants");
    safeRevalidate(`/${tenant.subdomain}`);

    const actionLabel = suspend ? "ditangguhkan (SUSPENDED)" : "diaktifkan kembali (ACTIVE)";
    const reasonMsg = reason?.trim() ? ` Catatan: ${reason.trim()}` : "";

    return {
      success: true,
      message: `Tenant "${tenant.companyName}" (${tenant.subdomain}) berhasil ${actionLabel}.${reasonMsg}`,
    };
  } catch (error) {
    console.error("[toggleTenantSuspension] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengubah status penangguhan tenant.",
    };
  }
}

/**
 * Update Subscription Tier, Status, Billing Cycle, and Expiration
 */
export async function updateTenantSubscription(
  tenantId: string,
  data: {
    subscriptionTier?: string;
    subscriptionStatus?: SubscriptionStatus;
    billingCycle?: string;
    trialEndsAt?: string | null;
  }
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, companyName: true, subdomain: true },
    });

    if (!tenant) {
      return { success: false, error: "Tenant tidak ditemukan." };
    }

    const updatePayload: {
      subscriptionTier?: string;
      subscriptionStatus?: SubscriptionStatus;
      billingCycle?: string;
      trialEndsAt?: Date | null;
      isActive?: boolean;
    } = {};

    if (data.subscriptionTier) {
      updatePayload.subscriptionTier = data.subscriptionTier.trim().toUpperCase();
    }

    if (data.subscriptionStatus) {
      updatePayload.subscriptionStatus = data.subscriptionStatus;
      if (
        data.subscriptionStatus === SubscriptionStatus.SUSPENDED ||
        data.subscriptionStatus === SubscriptionStatus.CANCELLED
      ) {
        updatePayload.isActive = false;
      } else if (
        data.subscriptionStatus === SubscriptionStatus.ACTIVE ||
        data.subscriptionStatus === SubscriptionStatus.TRIAL
      ) {
        updatePayload.isActive = true;
      }
    }

    if (data.billingCycle) {
      updatePayload.billingCycle = data.billingCycle.trim().toUpperCase();
    }

    if (data.trialEndsAt !== undefined) {
      updatePayload.trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null;
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: updatePayload,
    });

    await recordAuditLog({
      action: "TENANT_PLAN_UPDATE",
      targetType: "TENANT",
      targetId: tenant.id,
      targetName: tenant.companyName,
      details: {
        subdomain: tenant.subdomain,
        ...updatePayload,
      },
    });

    safeRevalidate("/admin");
    safeRevalidate("/admin/tenants");

    return {
      success: true,
      message: `Paket langganan tenant "${tenant.companyName}" berhasil diperbarui.`,
    };
  } catch (error) {
    console.error("[updateTenantSubscription] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui paket langganan tenant.",
    };
  }
}

/**
 * Extend Tenant Trial or Active Period by N days
 */
export async function extendTenantTrial(
  tenantId: string,
  additionalDays: number
): Promise<ActionResult<{ newTrialEndsAt: string }>> {
  try {
    await requireSuperAdmin();

    if (!additionalDays || additionalDays <= 0) {
      return { success: false, error: "Jumlah hari perpanjangan harus lebih besar dari 0." };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, companyName: true, trialEndsAt: true, subscriptionStatus: true },
    });

    if (!tenant) {
      return { success: false, error: "Tenant tidak ditemukan." };
    }

    const now = new Date();
    const baseDate =
      tenant.trialEndsAt && tenant.trialEndsAt.getTime() > now.getTime()
        ? tenant.trialEndsAt
        : now;

    const newTrialEndsAt = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        trialEndsAt: newTrialEndsAt,
        isActive: true,
        // If expired or suspended, restore to active or trial
        subscriptionStatus:
          tenant.subscriptionStatus === SubscriptionStatus.EXPIRED ||
          tenant.subscriptionStatus === SubscriptionStatus.CANCELLED ||
          tenant.subscriptionStatus === SubscriptionStatus.SUSPENDED
            ? SubscriptionStatus.TRIAL
            : tenant.subscriptionStatus,
      },
    });

    await recordAuditLog({
      action: "TENANT_TRIAL_EXTEND",
      targetType: "TENANT",
      targetId: tenant.id,
      targetName: tenant.companyName,
      details: {
        additionalDays,
        newTrialEndsAt: newTrialEndsAt.toISOString(),
      },
    });

    safeRevalidate("/admin");
    safeRevalidate("/admin/tenants");

    return {
      success: true,
      message: `Masa aktif tenant "${tenant.companyName}" berhasil diperpanjang +${additionalDays} hari hingga ${newTrialEndsAt.toLocaleDateString("id-ID")}.`,
      data: { newTrialEndsAt: newTrialEndsAt.toISOString() },
    };
  } catch (error) {
    console.error("[extendTenantTrial] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperpanjang masa aktif tenant.",
    };
  }
}

/**
 * Reset Tenant Admin Password / Access Credentials
 */
export async function resetTenantAdminAccess(
  tenantId: string,
  targetUserId?: string,
  customPassword?: string
): Promise<
  ActionResult<{
    userId: string;
    userName: string;
    userEmail: string;
    temporaryPassword: string;
  }>
> {
  try {
    await requireSuperAdmin();

    // Look for target user or primary admin
    let user;
    if (targetUserId) {
      user = await prisma.user.findFirst({
        where: { id: targetUserId, tenantId },
        include: { tenant: { select: { companyName: true } } },
      });
    } else {
      user = await prisma.user.findFirst({
        where: {
          tenantId,
          role: UserRole.TENANT_ADMIN,
        },
        include: { tenant: { select: { companyName: true } } },
      });

      if (!user) {
        user = await prisma.user.findFirst({
          where: { tenantId },
          include: { tenant: { select: { companyName: true } } },
        });
      }
    }

    if (!user) {
      return {
        success: false,
        error: "Tidak ditemukan akun administrator untuk tenant ini.",
      };
    }

    if (customPassword !== undefined && customPassword.trim().length < 6) {
      return {
        success: false,
        error: "Kata sandi kustom minimal terdiri dari 6 karakter.",
      };
    }

    // Generate clean, secure temporary password if not provided
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const temporaryPassword =
      customPassword?.trim() || `SF-${randomHex}!${Math.floor(100 + Math.random() * 900)}`;

    // Store in passwordHash and ensure user isActive is true
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: temporaryPassword,
        isActive: true,
      },
    });

    await recordAuditLog({
      action: "TENANT_PASSWORD_RESET",
      targetType: "TENANT",
      targetId: tenantId,
      targetName: user.tenant?.companyName || user.name,
      details: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      },
    });

    safeRevalidate("/admin");
    safeRevalidate("/admin/tenants");

    return {
      success: true,
      message: `Kredensial akses administrator untuk "${user.name}" (${user.email}) berhasil direset.`,
      data: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        temporaryPassword,
      },
    };
  } catch (error) {
    console.error("[resetTenantAdminAccess] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mereset akses administrator tenant.",
    };
  }
}

/**
 * Update Tenant Profile Details (Company name, Legal name, NPWP)
 */
export async function updateTenantProfile(
  tenantId: string,
  data: {
    companyName?: string;
    legalName?: string;
    taxId?: string;
  }
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    if (data.companyName !== undefined && data.companyName.trim() === "") {
      return { success: false, error: "Nama perusahaan tidak boleh kosong." };
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.companyName ? { companyName: data.companyName.trim() } : {}),
        ...(data.legalName !== undefined ? { legalName: data.legalName?.trim() || null } : {}),
        ...(data.taxId !== undefined ? { taxId: data.taxId?.trim() || null } : {}),
      },
    });

    await recordAuditLog({
      action: "TENANT_PROFILE_UPDATE",
      targetType: "TENANT",
      targetId: tenantId,
      targetName: updated.companyName,
      details: data,
    });

    safeRevalidate("/admin");
    safeRevalidate("/admin/tenants");

    return {
      success: true,
      message: `Profil tenant "${updated.companyName}" berhasil diperbarui.`,
    };
  } catch (error) {
    console.error("[updateTenantProfile] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui profil tenant.",
    };
  }
}
