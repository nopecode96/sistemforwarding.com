"use server";

import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { SubscriptionStatus, PlatformInvoiceStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createBorderPayQris } from "@/lib/borderpay";
import { recordAuditLog } from "./adminAuditActions";

// Types
export interface AdminPlatformPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number | null;
  billingCycle: string;
  durationDays: number;
  maxUsers: number;
  maxJobFiles: number;
  features: string[];
  badge: string | null;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  invoicesCount?: number;
}

export interface AdminPlatformInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenant: {
    id: string;
    subdomain: string;
    companyName: string;
    legalName: string | null;
    subscriptionStatus: SubscriptionStatus;
    subscriptionTier: string;
    trialEndsAt: string | null;
  };
  planId: string | null;
  planCode: string;
  planName: string;
  billingPeriod: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: PlatformInvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  qrisString: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBillingOverview {
  summary: {
    totalRevenue: number;
    paidInvoicesCount: number;
    pendingReceivables: number;
    pendingInvoicesCount: number;
    expiredInvoicesCount: number;
    cancelledInvoicesCount: number;
    totalInvoicesCount: number;
    activePlansCount: number;
  };
  invoices: AdminPlatformInvoice[];
  plans: AdminPlatformPlan[];
  tenants: Array<{
    id: string;
    subdomain: string;
    companyName: string;
    subscriptionStatus: SubscriptionStatus;
    subscriptionTier: string;
    trialEndsAt: string | null;
  }>;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface UpsertPlatformPlanInput {
  id?: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number | null;
  billingCycle: string;
  durationDays: number;
  maxUsers: number;
  maxJobFiles: number;
  features?: string[];
  badge?: string;
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
    revalidatePath(path, "page");
    revalidatePath(path, "layout");
  } catch {
    // Safely ignore when called outside Next.js request lifecycle (e.g. tests)
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
    };
  }

  const session = await getCurrentSession();
  if (!session || session.role !== "SUPERADMIN") {
    throw new Error(
      "Akses ditolak: Operasi ini membutuhkan hak istimewa Super Administrator."
    );
  }
  return session;
}

/**
 * Ensure default SaaS plans exist in DB (Self-seeding and updating core specs)
 */
export async function ensureDefaultPlatformPlans() {
  return ensureDefaultPlansExist();
}

async function ensureDefaultPlansExist() {
  const defaultPlans = [
    {
      code: "TRIAL",
      name: "Free Trial 7 Hari",
      description: "Uji coba seluruh modul operasional kargo tanpa komitmen (tidak ada pembayaran saat onboarding).",
      price: 0,
      originalPrice: null as number | null,
      billingCycle: "TRIAL",
      durationDays: 7,
      maxUsers: 2,
      maxJobFiles: 15,
      features: [
        "Maksimal 15 Job Files aktif",
        "Subdomain mandiri eksklusif",
        "Cetak dokumen BL & AWB draft",
        "Modul pembuatan Invoice",
        "Akses 2 Operator / User",
        "Dukungan Komunitas",
      ],
      badge: "Uji Coba Gratis",
      isPopular: false,
      isActive: true,
      sortOrder: 1,
    },
    {
      code: "MONTHLY",
      name: "Bisnis Profesional",
      description: "Solusi lengkap untuk forwarder bertumbuh dengan volume kargo aktif.",
      price: 1000000,
      originalPrice: 3000000,
      billingCycle: "MONTHLY",
      durationDays: 30,
      maxUsers: 10,
      maxJobFiles: 500,
      features: [
        "Unlimited Job Files kargo laut, udara, darat",
        "Invoicing instan dengan hitungan PPN 1.1%",
        "Verifikasi QRIS BorderPay otomatis autopilot",
        "Laporan Gross Profit & Dashboard AP/AR",
        "Notifikasi WhatsApp & Email instan",
        "Multi-User & Hak Akses Berjenjang (RBAC)",
      ],
      badge: "Paling Populer",
      isPopular: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      code: "YEARLY",
      name: "Enterprise Corpora",
      description: "Efisiensi maksimal untuk konsolidasi jangka panjang dan skala korporasi.",
      price: 10000000,
      originalPrice: 12000000,
      billingCycle: "YEARLY",
      durationDays: 365,
      maxUsers: 50,
      maxJobFiles: 99999,
      features: [
        "Semua fitur Paket Profesional Bulanan",
        "Public Tracking System & REST API Embed (ditanam di website forwarder)",
        "Hemat biaya berlangganan tahunan",
        "Dukungan prioritas teknis 24/7 (SLA 1 Jam)",
        "Bantuan migrasi master data klien & vendor",
        "Dedicated Account Manager",
        "Dukungan Custom Domain Perusahaan Sendiri",
      ],
      badge: "Rekomendasi Terbaik",
      isPopular: false,
      isActive: true,
      sortOrder: 3,
    },
    {
      code: "PAY_PER_JOB",
      name: "Pay-Per-Job",
      description: "Bayar sesuai pemakaian job file kargo, ditagih di akhir bulan tanpa pembayaran saat onboarding.",
      price: 50000,
      originalPrice: 100000,
      billingCycle: "PAY_PER_JOB",
      durationDays: 30,
      maxUsers: 10,
      maxJobFiles: 99999,
      features: [
        "Rp 50.000 per Job File yang dibuat",
        "Ditagih di akhir bulan sesuai pemakaian",
        "Tanpa pembayaran saat onboarding",
        "Akses seluruh modul kargo laut, udara, darat",
        "Invoicing instan & pelacakan status",
        "Multi-User hingga 10 operator",
      ],
      badge: "Fleksibel",
      isPopular: false,
      isActive: true,
      sortOrder: 4,
    },
  ];

  for (const p of defaultPlans) {
    const existing = await prisma.platformPlan.findUnique({
      where: { code: p.code },
    });

    if (!existing) {
      await prisma.platformPlan.create({ data: p });

      // Mirror to SystemDictionary for public pricing & onboarding synchronization
      try {
        const dictMetadata = {
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          badge: p.badge,
          isPopular: p.isPopular,
          features: p.features,
          billingPeriod:
            p.billingCycle === "YEARLY"
              ? "per tahun"
              : p.billingCycle === "PAY_PER_JOB"
              ? "per job"
              : p.billingCycle === "TRIAL"
              ? "7 Hari Akses"
              : "per bulan",
          formattedPrice: `Rp ${Number(p.price).toLocaleString("id-ID")}`,
          formattedOriginalPrice: p.originalPrice
            ? `Rp ${Number(p.originalPrice).toLocaleString("id-ID")}`
            : null,
        };

        const existingDict = await prisma.systemDictionary.findFirst({
          where: { tenantId: null, category: "SUBSCRIPTION_PLAN", code: p.code },
        });

        if (!existingDict) {
          await prisma.systemDictionary.create({
            data: {
              tenantId: null,
              category: "SUBSCRIPTION_PLAN",
              code: p.code,
              label: p.name,
              sortOrder: p.sortOrder,
              isActive: p.isActive,
              metadata: dictMetadata,
            },
          });
        }
      } catch {
        // safe fallback
      }
    }
  }
}

/**
 * 1. PLATFORM PLANS ACTIONS
 */

export async function getPlatformPlans(): Promise<AdminPlatformPlan[]> {
  await requireSuperAdmin();
  await ensureDefaultPlansExist();

  const plans = await prisma.platformPlan.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { invoices: true },
      },
    },
  });

  return plans.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    billingCycle: p.billingCycle,
    durationDays: p.durationDays,
    maxUsers: p.maxUsers,
    maxJobFiles: p.maxJobFiles,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    badge: p.badge,
    isPopular: p.isPopular,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    invoicesCount: p._count.invoices,
  }));
}

export async function upsertPlatformPlan(
  input: UpsertPlatformPlanInput
): Promise<ActionResult<AdminPlatformPlan>> {
  try {
    await requireSuperAdmin();

    const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
    if (!code) {
      return { success: false, error: "Kode paket langganan wajib diisi." };
    }
    if (!input.name.trim()) {
      return { success: false, error: "Nama paket langganan wajib diisi." };
    }
    if (input.price < 0) {
      return { success: false, error: "Harga paket tidak boleh bernilai negatif." };
    }

    const originalPrice =
      input.originalPrice !== undefined &&
      input.originalPrice !== null &&
      !isNaN(Number(input.originalPrice)) &&
      Number(input.originalPrice) > 0
        ? Number(input.originalPrice)
        : null;

    const payload = {
      code,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price: input.price,
      originalPrice,
      billingCycle: input.billingCycle?.trim().toUpperCase() || "MONTHLY",
      durationDays: Math.max(1, input.durationDays || 30),
      maxUsers: Math.max(1, input.maxUsers || 5),
      maxJobFiles: Math.max(1, input.maxJobFiles || 100),
      features: input.features || [],
      badge: input.badge?.trim() || null,
      isPopular: Boolean(input.isPopular),
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
      sortOrder: Number(input.sortOrder) || 0,
    };

    let resultPlan;
    if (input.id) {
      resultPlan = await prisma.platformPlan.update({
        where: { id: input.id },
        data: payload,
      });
    } else {
      resultPlan = await prisma.platformPlan.upsert({
        where: { code },
        update: payload,
        create: payload,
      });
    }

    // Keep SystemDictionary SUBSCRIPTION_PLAN synced for onboarding & public pricing
    try {
      const existingDict = await prisma.systemDictionary.findFirst({
        where: {
          tenantId: null,
          category: "SUBSCRIPTION_PLAN",
          code,
        },
      });

      const dictMetadata = {
        price: Number(resultPlan.price),
        originalPrice: resultPlan.originalPrice ? Number(resultPlan.originalPrice) : null,
        badge: resultPlan.badge,
        isPopular: resultPlan.isPopular,
        features: resultPlan.features,
        billingPeriod:
          resultPlan.billingCycle === "YEARLY"
            ? "per tahun"
            : resultPlan.billingCycle === "PAY_PER_JOB"
            ? "per job"
            : resultPlan.billingCycle === "TRIAL"
            ? "7 Hari Akses"
            : "per bulan",
        formattedPrice: `Rp ${Number(resultPlan.price).toLocaleString("id-ID")}`,
        formattedOriginalPrice: resultPlan.originalPrice
          ? `Rp ${Number(resultPlan.originalPrice).toLocaleString("id-ID")}`
          : null,
      };

      if (existingDict) {
        await prisma.systemDictionary.update({
          where: { id: existingDict.id },
          data: {
            label: resultPlan.name,
            sortOrder: resultPlan.sortOrder,
            isActive: resultPlan.isActive,
            metadata: dictMetadata,
          },
        });
      } else {
        await prisma.systemDictionary.create({
          data: {
            tenantId: null,
            category: "SUBSCRIPTION_PLAN",
            code,
            label: resultPlan.name,
            sortOrder: resultPlan.sortOrder,
            isActive: resultPlan.isActive,
            metadata: dictMetadata,
          },
        });
      }
    } catch (syncErr) {
      console.warn("[upsertPlatformPlan] SystemDictionary sync warning:", syncErr);
    }

    await recordAuditLog({
      action: "PLAN_UPSERT",
      targetType: "PLAN",
      targetId: resultPlan.id,
      targetName: resultPlan.name,
      details: {
        code: resultPlan.code,
        price: Number(resultPlan.price),
        billingCycle: resultPlan.billingCycle,
        isActive: resultPlan.isActive,
      },
    });

    safeRevalidate("/admin/plans");
    safeRevalidate("/admin/billing");
    safeRevalidate("/admin");
    safeRevalidate("/");
    safeRevalidate("/#harga");
    safeRevalidate("/onboarding");
    safeRevalidate("/admin");
    safeRevalidate("/");
    safeRevalidate("/#harga");
    safeRevalidate("/onboarding");

    return {
      success: true,
      message: `Paket langganan "${resultPlan.name}" (${resultPlan.code}) berhasil disimpan.`,
      data: {
        id: resultPlan.id,
        code: resultPlan.code,
        name: resultPlan.name,
        description: resultPlan.description,
        price: Number(resultPlan.price),
        originalPrice: resultPlan.originalPrice ? Number(resultPlan.originalPrice) : null,
        billingCycle: resultPlan.billingCycle,
        durationDays: resultPlan.durationDays,
        maxUsers: resultPlan.maxUsers,
        maxJobFiles: resultPlan.maxJobFiles,
        features: Array.isArray(resultPlan.features) ? (resultPlan.features as string[]) : [],
        badge: resultPlan.badge,
        isPopular: resultPlan.isPopular,
        isActive: resultPlan.isActive,
        sortOrder: resultPlan.sortOrder,
        createdAt: resultPlan.createdAt.toISOString(),
        updatedAt: resultPlan.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[upsertPlatformPlan] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan paket langganan.",
    };
  }
}

export async function togglePlatformPlanActive(
  planId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const plan = await prisma.platformPlan.update({
      where: { id: planId },
      data: { isActive },
    });

    try {
      await prisma.systemDictionary.updateMany({
        where: {
          tenantId: null,
          category: "SUBSCRIPTION_PLAN",
          code: plan.code,
        },
        data: { isActive },
      });
    } catch {
      // safe fallback
    }

    await recordAuditLog({
      action: "PLAN_TOGGLE",
      targetType: "PLAN",
      targetId: plan.id,
      targetName: plan.name,
      details: {
        code: plan.code,
        isActive,
      },
    });

    safeRevalidate("/admin/plans");
    safeRevalidate("/admin/billing");
    safeRevalidate("/admin");
    safeRevalidate("/");
    safeRevalidate("/#harga");
    safeRevalidate("/onboarding");

    return {
      success: true,
      message: `Status paket "${plan.name}" diubah menjadi ${isActive ? "AKTIF" : "NONAKTIF"}.`,
    };
  } catch (error) {
    console.error("[togglePlatformPlanActive] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengubah status paket.",
    };
  }
}

export async function deletePlatformPlan(planId: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const plan = await prisma.platformPlan.findUnique({
      where: { id: planId },
      include: { _count: { select: { invoices: true } } },
    });

    if (!plan) {
      return { success: false, error: "Paket langganan tidak ditemukan." };
    }

    // Protect core default plans from hard deletion
    if (["TRIAL", "MONTHLY", "YEARLY", "PAY_PER_JOB"].includes(plan.code)) {
      await prisma.platformPlan.update({
        where: { id: planId },
        data: { isActive: false },
      });
      try {
        await prisma.systemDictionary.updateMany({
          where: {
            tenantId: null,
            category: "SUBSCRIPTION_PLAN",
            code: plan.code,
          },
          data: { isActive: false },
        });
      } catch {
        // safe fallback
      }
      safeRevalidate("/admin/plans");
      safeRevalidate("/admin/billing");
      safeRevalidate("/admin");
      safeRevalidate("/");
      safeRevalidate("/#harga");
      safeRevalidate("/onboarding");
      return {
        success: true,
        message: `Paket bawaan sistem "${plan.name}" dinonaktifkan, bukan dihapus permanen demi integritas sistem.`,
      };
    }

    if (plan._count.invoices > 0) {
      // Do not hard delete if invoices reference it; deactivate instead
      await prisma.platformPlan.update({
        where: { id: planId },
        data: { isActive: false },
      });
      try {
        await prisma.systemDictionary.updateMany({
          where: {
            tenantId: null,
            category: "SUBSCRIPTION_PLAN",
            code: plan.code,
          },
          data: { isActive: false },
        });
      } catch {
        // safe fallback
      }
      safeRevalidate("/admin/plans");
      safeRevalidate("/admin/billing");
      safeRevalidate("/admin");
      safeRevalidate("/");
      safeRevalidate("/#harga");
      safeRevalidate("/onboarding");
      return {
        success: true,
        message: `Paket "${plan.name}" memiliki riwayat invoice sehingga dinonaktifkan (diarsipkan), bukan dihapus permanen.`,
      };
    }

    await prisma.platformPlan.delete({ where: { id: planId } });
    try {
      await prisma.systemDictionary.deleteMany({
        where: {
          tenantId: null,
          category: "SUBSCRIPTION_PLAN",
          code: plan.code,
        },
      });
    } catch {
      // safe fallback
    }

    await recordAuditLog({
      action: "PLAN_DELETE",
      targetType: "PLAN",
      targetId: plan.id,
      targetName: plan.name,
      details: {
        code: plan.code,
      },
    });

    safeRevalidate("/admin/plans");
    safeRevalidate("/admin/billing");
    safeRevalidate("/admin");
    safeRevalidate("/");
    safeRevalidate("/#harga");
    safeRevalidate("/onboarding");

    return {
      success: true,
      message: `Paket "${plan.name}" berhasil dihapus.`,
    };
  } catch (error) {
    console.error("[deletePlatformPlan] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus paket langganan.",
    };
  }
}

/**
 * 2. SAAS BILLING & PLATFORM INVOICES ACTIONS
 */

export async function getPlatformBillingOverview(filters?: {
  status?: string;
  search?: string;
}): Promise<AdminBillingOverview> {
  await requireSuperAdmin();
  await ensureDefaultPlansExist();

  // 1. Invoices filter
  const whereClause: Prisma.PlatformInvoiceWhereInput = {};
  if (filters?.status && filters.status !== "ALL") {
    whereClause.status = filters.status as PlatformInvoiceStatus;
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim();
    whereClause.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" } },
      { planName: { contains: q, mode: "insensitive" } },
      { tenant: { companyName: { contains: q, mode: "insensitive" } } },
      { tenant: { subdomain: { contains: q, mode: "insensitive" } } },
    ];
  }

  // 2. Fetch invoices, plans, and tenants concurrently
  const [allInvoices, filteredInvoices, rawPlans, rawTenants] = await Promise.all([
    prisma.platformInvoice.findMany({
      select: {
        id: true,
        status: true,
        totalAmount: true,
      },
    }),
    prisma.platformInvoice.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            subdomain: true,
            companyName: true,
            legalName: true,
            subscriptionStatus: true,
            subscriptionTier: true,
            trialEndsAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.platformPlan.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { invoices: true } } },
    }),
    prisma.tenant.findMany({
      select: {
        id: true,
        subdomain: true,
        companyName: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEndsAt: true,
      },
      orderBy: { companyName: "asc" },
    }),
  ]);

  // 3. Compute Metrics
  let totalRevenue = 0;
  let paidInvoicesCount = 0;
  let pendingReceivables = 0;
  let pendingInvoicesCount = 0;
  let expiredInvoicesCount = 0;
  let cancelledInvoicesCount = 0;

  for (const inv of allInvoices) {
    const amt = Number(inv.totalAmount);
    if (inv.status === PlatformInvoiceStatus.PAID) {
      totalRevenue += amt;
      paidInvoicesCount++;
    } else if (inv.status === PlatformInvoiceStatus.PENDING) {
      pendingReceivables += amt;
      pendingInvoicesCount++;
    } else if (inv.status === PlatformInvoiceStatus.EXPIRED) {
      expiredInvoicesCount++;
    } else if (inv.status === PlatformInvoiceStatus.CANCELLED) {
      cancelledInvoicesCount++;
    }
  }

  const activePlansCount = rawPlans.filter((p) => p.isActive).length;

  const summary = {
    totalRevenue,
    paidInvoicesCount,
    pendingReceivables,
    pendingInvoicesCount,
    expiredInvoicesCount,
    cancelledInvoicesCount,
    totalInvoicesCount: allInvoices.length,
    activePlansCount,
  };

  const invoices: AdminPlatformInvoice[] = filteredInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    tenantId: inv.tenantId,
    tenant: {
      id: inv.tenant.id,
      subdomain: inv.tenant.subdomain,
      companyName: inv.tenant.companyName,
      legalName: inv.tenant.legalName,
      subscriptionStatus: inv.tenant.subscriptionStatus,
      subscriptionTier: inv.tenant.subscriptionTier,
      trialEndsAt: inv.tenant.trialEndsAt ? inv.tenant.trialEndsAt.toISOString() : null,
    },
    planId: inv.planId,
    planCode: inv.planCode,
    planName: inv.planName,
    billingPeriod: inv.billingPeriod,
    amount: Number(inv.amount),
    taxAmount: Number(inv.taxAmount),
    totalAmount: Number(inv.totalAmount),
    status: inv.status,
    dueDate: inv.dueDate.toISOString(),
    paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
    paymentMethod: inv.paymentMethod,
    paymentReference: inv.paymentReference,
    qrisString: inv.qrisString,
    notes: inv.notes,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  }));

  const plans: AdminPlatformPlan[] = rawPlans.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    billingCycle: p.billingCycle,
    durationDays: p.durationDays,
    maxUsers: p.maxUsers,
    maxJobFiles: p.maxJobFiles,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    badge: p.badge,
    isPopular: p.isPopular,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    invoicesCount: p._count.invoices,
  }));

  const tenants = rawTenants.map((t) => ({
    id: t.id,
    subdomain: t.subdomain,
    companyName: t.companyName,
    subscriptionStatus: t.subscriptionStatus,
    subscriptionTier: t.subscriptionTier,
    trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
  }));

  return { summary, invoices, plans, tenants };
}

export async function generatePlatformInvoice(input: {
  tenantId: string;
  planIdOrCode: string;
  customAmount?: number;
  billingPeriod?: string;
  notes?: string;
  withBorderPayQris?: boolean;
}): Promise<ActionResult<AdminPlatformInvoice>> {
  try {
    await requireSuperAdmin();

    const tenant = await prisma.tenant.findUnique({
      where: { id: input.tenantId },
      include: { users: { take: 1 } },
    });

    if (!tenant) {
      return { success: false, error: "Tenant tidak ditemukan." };
    }

    const plan = await prisma.platformPlan.findFirst({
      where: {
        OR: [{ id: input.planIdOrCode }, { code: input.planIdOrCode.toUpperCase() }],
      },
    });

    const planCode = plan?.code || input.planIdOrCode.toUpperCase();
    const planName = plan?.name || `Paket ${planCode}`;
    const amount =
      input.customAmount !== undefined && input.customAmount >= 0
        ? input.customAmount
        : plan
        ? Number(plan.price)
        : 1000000;

    const taxAmount = 0; // SaaS platform pricing is net / tax inclusive
    const totalAmount = amount + taxAmount;

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    let invoiceNumber = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `SAAS-${yearMonth}-${Math.floor(1000 + Math.random() * 9000)}`;
      const existing = await prisma.platformInvoice.findUnique({
        where: { invoiceNumber: candidate },
        select: { id: true },
      });
      if (!existing) {
        invoiceNumber = candidate;
        break;
      }
    }
    if (!invoiceNumber) {
      invoiceNumber = `SAAS-${yearMonth}-${Date.now().toString().slice(-4)}`;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Default 7 days payment terms

    const billingPeriod =
      input.billingPeriod ||
      (plan?.billingCycle === "YEARLY"
        ? "1 Tahun Langganan"
        : plan?.billingCycle === "PAY_PER_JOB"
        ? "Tagihan Pay-Per-Job"
        : plan?.billingCycle === "TRIAL"
        ? "7 Hari Uji Coba"
        : "1 Bulan Langganan");

    let qrisString: string | null = null;
    let paymentReference: string | null = null;

    if (input.withBorderPayQris && totalAmount > 0) {
      const qrisRes = await createBorderPayQris({
        amount: totalAmount,
        referenceId: invoiceNumber,
        description: `Langganan Sistem Forwarding ${planName} - ${tenant.companyName}`,
        customerName: tenant.companyName,
        customerEmail: tenant.users[0]?.email,
      });

      if (qrisRes.success && qrisRes.qrisString) {
        qrisString = qrisRes.qrisString;
        paymentReference = qrisRes.referenceId || invoiceNumber;
      }
    }

    const created = await prisma.platformInvoice.create({
      data: {
        invoiceNumber,
        tenantId: tenant.id,
        planId: plan?.id || null,
        planCode,
        planName,
        billingPeriod,
        amount,
        taxAmount,
        totalAmount,
        status: PlatformInvoiceStatus.PENDING,
        dueDate,
        paymentMethod: qrisString ? "QRIS BorderPay" : null,
        paymentReference,
        qrisString,
        notes: input.notes?.trim() || null,
      },
      include: {
        tenant: {
          select: {
            id: true,
            subdomain: true,
            companyName: true,
            legalName: true,
            subscriptionStatus: true,
            subscriptionTier: true,
            trialEndsAt: true,
          },
        },
      },
    });

    await recordAuditLog({
      action: "INVOICE_GENERATE",
      targetType: "INVOICE",
      targetId: created.id,
      targetName: created.invoiceNumber,
      details: {
        tenantId: created.tenantId,
        tenantName: tenant.companyName,
        amount: Number(created.totalAmount),
        planCode: created.planCode,
      },
    });

    safeRevalidate("/admin/billing");
    safeRevalidate("/admin/tenants");

    return {
      success: true,
      message: `Invoice SaaS "${created.invoiceNumber}" untuk "${tenant.companyName}" berhasil dibuat.`,
      data: {
        id: created.id,
        invoiceNumber: created.invoiceNumber,
        tenantId: created.tenantId,
        tenant: {
          id: created.tenant.id,
          subdomain: created.tenant.subdomain,
          companyName: created.tenant.companyName,
          legalName: created.tenant.legalName,
          subscriptionStatus: created.tenant.subscriptionStatus,
          subscriptionTier: created.tenant.subscriptionTier,
          trialEndsAt: created.tenant.trialEndsAt
            ? created.tenant.trialEndsAt.toISOString()
            : null,
        },
        planId: created.planId,
        planCode: created.planCode,
        planName: created.planName,
        billingPeriod: created.billingPeriod,
        amount: Number(created.amount),
        taxAmount: Number(created.taxAmount),
        totalAmount: Number(created.totalAmount),
        status: created.status,
        dueDate: created.dueDate.toISOString(),
        paidAt: created.paidAt ? created.paidAt.toISOString() : null,
        paymentMethod: created.paymentMethod,
        paymentReference: created.paymentReference,
        qrisString: created.qrisString,
        notes: created.notes,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[generatePlatformInvoice] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menerbitkan invoice SaaS.",
    };
  }
}

export async function markPlatformInvoicePaid(
  invoiceId: string,
  options?: {
    paymentMethod?: string;
    paymentReference?: string;
    notes?: string;
    extendDays?: number;
  }
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const invoice = await prisma.platformInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        plan: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice tidak ditemukan." };
    }

    if (invoice.status === PlatformInvoiceStatus.PAID) {
      return { success: false, error: "Invoice sudah berstatus LUNAS (PAID)." };
    }

    // Determine extension days: options.extendDays > plan.durationDays > fallback by planCode
    const extendDays =
      options?.extendDays ||
      invoice.plan?.durationDays ||
      (invoice.planCode === "YEARLY" ? 365 : invoice.planCode === "TRIAL" ? 7 : 30);

    // Compute new subscription expiration
    const currentExpiry =
      invoice.tenant.trialEndsAt && new Date(invoice.tenant.trialEndsAt) > new Date()
        ? new Date(invoice.tenant.trialEndsAt)
        : new Date();

    const newExpiry = new Date(currentExpiry.getTime() + extendDays * 24 * 60 * 60 * 1000);

    const paymentMethod = options?.paymentMethod || "MANUAL_APPROVAL";
    const paymentReference =
      options?.paymentReference || `MANUAL-${Date.now().toString().slice(-6)}`;
    const paidAt = new Date();

    await prisma.$transaction([
      prisma.platformInvoice.update({
        where: { id: invoice.id },
        data: {
          status: PlatformInvoiceStatus.PAID,
          paidAt,
          paymentMethod,
          paymentReference,
          notes: options?.notes ? `${invoice.notes || ""}\n${options.notes}`.trim() : invoice.notes,
        },
      }),
      prisma.tenant.update({
        where: { id: invoice.tenantId },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionTier: invoice.planCode,
          trialEndsAt: newExpiry,
          isActive: true,
        },
      }),
    ]);

    await recordAuditLog({
      action: "INVOICE_PAID_MANUAL",
      targetType: "INVOICE",
      targetId: invoice.id,
      targetName: invoice.invoiceNumber,
      details: {
        tenantId: invoice.tenantId,
        tenantName: invoice.tenant.companyName,
        amount: Number(invoice.totalAmount),
        paymentMethod,
        paymentReference,
        newExpiry: newExpiry.toISOString(),
      },
    });

    safeRevalidate("/admin/billing");
    safeRevalidate("/admin/tenants");
    safeRevalidate("/admin");

    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} berhasil disetujui (PAID). Langganan "${invoice.tenant.companyName}" diperpanjang hingga ${newExpiry.toLocaleDateString("id-ID")}.`,
    };
  } catch (error) {
    console.error("[markPlatformInvoicePaid] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memproses pembayaran invoice.",
    };
  }
}

export async function cancelPlatformInvoice(
  invoiceId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const invoice = await prisma.platformInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return { success: false, error: "Invoice tidak ditemukan." };
    }

    if (invoice.status === PlatformInvoiceStatus.PAID) {
      return { success: false, error: "Invoice yang sudah lunas tidak dapat dibatalkan." };
    }

    if (invoice.status === PlatformInvoiceStatus.CANCELLED) {
      return { success: false, error: "Invoice ini sudah dibatalkan sebelumnya." };
    }

    await prisma.platformInvoice.update({
      where: { id: invoiceId },
      data: {
        status: PlatformInvoiceStatus.CANCELLED,
        notes: reason ? `${invoice.notes || ""}\nDibatalkan: ${reason}`.trim() : invoice.notes,
      },
    });

    await recordAuditLog({
      action: "INVOICE_CANCEL",
      targetType: "INVOICE",
      targetId: invoice.id,
      targetName: invoice.invoiceNumber,
      details: {
        tenantId: invoice.tenantId,
        reason: reason || null,
      },
    });

    safeRevalidate("/admin/billing");

    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} berhasil dibatalkan (VOID/CANCELLED).`,
    };
  } catch (error) {
    console.error("[cancelPlatformInvoice] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membatalkan invoice.",
    };
  }
}

export async function reconcileBorderPayPayment(
  referenceId: string,
  transactionId?: string
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const invoice = await prisma.platformInvoice.findFirst({
      where: {
        OR: [
          { invoiceNumber: referenceId },
          { paymentReference: referenceId },
          { id: referenceId },
        ],
      },
      include: { tenant: true, plan: true },
    });

    if (!invoice) {
      return { success: false, error: `Invoice dengan referensi "${referenceId}" tidak ditemukan.` };
    }

    if (invoice.status === PlatformInvoiceStatus.PAID) {
      return {
        success: true,
        message: `Invoice ${invoice.invoiceNumber} sudah berstatus LUNAS sebelumnya.`,
      };
    }

    return await markPlatformInvoicePaid(invoice.id, {
      paymentMethod: "QRIS BorderPay",
      paymentReference: transactionId || referenceId,
      notes: "Rekonsiliasi otomatis BorderPay settlement.",
    });
  } catch (error) {
    console.error("[reconcileBorderPayPayment] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal merekonsiliasi pembayaran BorderPay.",
    };
  }
}
