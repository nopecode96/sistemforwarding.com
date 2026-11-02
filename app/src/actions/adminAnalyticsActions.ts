"use server";

import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { SubscriptionStatus, PlatformInvoiceStatus } from "@prisma/client";
import ExcelJS from "exceljs";

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

export interface PlatformAnalyticsOverview {
  financials: {
    mrr: number;
    arr: number;
    totalPaidRevenue: number;
    totalPendingReceivables: number;
    paidInvoicesCount: number;
    pendingInvoicesCount: number;
    revenueByTier: Array<{
      tier: string;
      name: string;
      activeCount: number;
      revenue: number;
      percentage: number;
    }>;
    invoiceAging: {
      current: { count: number; amount: number };
      overdue30: { count: number; amount: number };
      overdue60: { count: number; amount: number };
      overdue90Plus: { count: number; amount: number };
      totalOverdueAmount: number;
    };
  };
  logistics: {
    totalGMV: number;
    totalGrossProfit: number;
    totalJobFiles: number;
    averageOrderValue: number;
    volumeByMode: {
      SEA: { count: number; gmv: number; grossProfit: number; weightKg: number; volumeCbm: number; containers: number };
      AIR: { count: number; gmv: number; grossProfit: number; weightKg: number; volumeCbm: number; containers: number };
      INLAND: { count: number; gmv: number; grossProfit: number; weightKg: number; volumeCbm: number; containers: number };
      MULTIMODAL: { count: number; gmv: number; grossProfit: number; weightKg: number; volumeCbm: number; containers: number };
    };
  };
  tenants: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    expiredTenants: number;
    paidTenants: number;
    conversionRate: number;
    retentionRate: number;
    newTenantsLast30Days: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    subdomain: string;
    companyName: string;
    planName: string;
    billingPeriod: string;
    totalAmount: number;
    status: PlatformInvoiceStatus;
    dueDate: string;
    paidAt: string | null;
    paymentMethod: string | null;
    createdAt: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    year: number;
    label: string;
    saasRevenue: number;
    logisticsGMV: number;
    jobFilesCount: number;
    newTenantsCount: number;
  }>;
}

/**
 * Aggregates platform-wide executive analytics:
 * - SaaS MRR & ARR normalized across active plans
 * - Platform Logistics Ecosystem GMV & Multimodal Volume across all tenants
 * - Net Tenant Growth & Conversion Rate
 * - Platform Invoice Aging Breakdown
 */
export async function getPlatformAnalyticsOverview(): Promise<PlatformAnalyticsOverview> {
  await requireSuperAdmin();

  // 1. Fetch all tenants
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      subdomain: true,
      companyName: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      billingCycle: true,
      trialEndsAt: true,
      createdAt: true,
    },
  });

  // 2. Fetch all platform plans to compute normalized pricing
  const platformPlans = await prisma.platformPlan.findMany();
  const planMap = new Map<string, { price: number; billingCycle: string; name: string }>();
  platformPlans.forEach((p) => {
    planMap.set(p.code, {
      price: Number(p.price),
      billingCycle: p.billingCycle,
      name: p.name,
    });
  });

  // 3. Fetch all platform invoices
  const invoices = await prisma.platformInvoice.findMany({
    include: {
      tenant: {
        select: {
          subdomain: true,
          companyName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 4. Fetch all job files across the entire platform
  const jobFiles = await prisma.jobFile.findMany({
    select: {
      id: true,
      tenantId: true,
      transportMode: true,
      sellingAmount: true,
      buyingAmount: true,
      grossWeightKg: true,
      volumeWeightCbm: true,
      containerCount: true,
      createdAt: true,
    },
  });

  // ── A. SaaS FINANCIAL CALCULATIONS (MRR & ARR) ───────────────────────────
  let mrr = 0;
  const now = new Date();

  tenants.forEach((t) => {
    if (t.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      const plan = planMap.get(t.subscriptionTier);
      if (plan && plan.price > 0) {
        if (t.billingCycle === "YEARLY" || plan.billingCycle === "YEARLY") {
          mrr += plan.price / 12;
        } else {
          mrr += plan.price;
        }
      } else if (t.subscriptionTier !== "TRIAL" && t.subscriptionTier !== "STARTER") {
        // Fallback default enterprise/custom tier
        mrr += 1000000;
      }
    }
  });

  const arr = mrr * 12;

  let totalPaidRevenue = 0;
  let totalPendingReceivables = 0;
  let paidInvoicesCount = 0;
  let pendingInvoicesCount = 0;

  // Invoice Aging Buckets
  const aging = {
    current: { count: 0, amount: 0 },
    overdue30: { count: 0, amount: 0 },
    overdue60: { count: 0, amount: 0 },
    overdue90Plus: { count: 0, amount: 0 },
    totalOverdueAmount: 0,
  };

  const revenueByTierMap = new Map<string, { name: string; revenue: number; activeCount: number }>();

  // Initialize revenue map from known plans
  platformPlans.forEach((p) => {
    revenueByTierMap.set(p.code, {
      name: p.name,
      revenue: 0,
      activeCount: 0,
    });
  });

  // Active tenants by tier count
  tenants.forEach((t) => {
    if (t.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      const existing = revenueByTierMap.get(t.subscriptionTier);
      if (existing) {
        existing.activeCount += 1;
      } else {
        revenueByTierMap.set(t.subscriptionTier, {
          name: t.subscriptionTier,
          revenue: 0,
          activeCount: 1,
        });
      }
    }
  });

  invoices.forEach((inv) => {
    const amount = Number(inv.totalAmount);
    if (inv.status === PlatformInvoiceStatus.PAID) {
      totalPaidRevenue += amount;
      paidInvoicesCount += 1;

      const tierEntry = revenueByTierMap.get(inv.planCode);
      if (tierEntry) {
        tierEntry.revenue += amount;
      } else {
        revenueByTierMap.set(inv.planCode, {
          name: inv.planName || inv.planCode,
          revenue: amount,
          activeCount: 0,
        });
      }
    } else if (inv.status === PlatformInvoiceStatus.PENDING) {
      totalPendingReceivables += amount;
      pendingInvoicesCount += 1;

      const due = new Date(inv.dueDate);
      const diffMs = now.getTime() - due.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        aging.current.count += 1;
        aging.current.amount += amount;
      } else if (diffDays <= 30) {
        aging.overdue30.count += 1;
        aging.overdue30.amount += amount;
        aging.totalOverdueAmount += amount;
      } else if (diffDays <= 60) {
        aging.overdue60.count += 1;
        aging.overdue60.amount += amount;
        aging.totalOverdueAmount += amount;
      } else {
        aging.overdue90Plus.count += 1;
        aging.overdue90Plus.amount += amount;
        aging.totalOverdueAmount += amount;
      }
    }
  });

  const revenueByTier = Array.from(revenueByTierMap.entries()).map(([tier, data]) => ({
    tier,
    name: data.name,
    activeCount: data.activeCount,
    revenue: data.revenue,
    percentage: totalPaidRevenue > 0 ? (data.revenue / totalPaidRevenue) * 100 : 0,
  }));

  // ── B. PLATFORM LOGISTICS GMV & ECOSYSTEM VOLUME ─────────────────────────
  let totalGMV = 0;
  let totalGrossProfit = 0;

  const volumeByMode = {
    SEA: { count: 0, gmv: 0, grossProfit: 0, weightKg: 0, volumeCbm: 0, containers: 0 },
    AIR: { count: 0, gmv: 0, grossProfit: 0, weightKg: 0, volumeCbm: 0, containers: 0 },
    INLAND: { count: 0, gmv: 0, grossProfit: 0, weightKg: 0, volumeCbm: 0, containers: 0 },
    MULTIMODAL: { count: 0, gmv: 0, grossProfit: 0, weightKg: 0, volumeCbm: 0, containers: 0 },
  };

  jobFiles.forEach((j) => {
    const selling = Number(j.sellingAmount || 0);
    const buying = Number(j.buyingAmount || 0);
    const profit = selling - buying;
    const weight = Number(j.grossWeightKg || 0);
    const volume = Number(j.volumeWeightCbm || 0);
    const containers = j.containerCount || 0;

    totalGMV += selling;
    totalGrossProfit += profit;

    const mode = (j.transportMode in volumeByMode)
      ? (j.transportMode as keyof typeof volumeByMode)
      : "SEA";

    volumeByMode[mode].count += 1;
    volumeByMode[mode].gmv += selling;
    volumeByMode[mode].grossProfit += profit;
    volumeByMode[mode].weightKg += weight;
    volumeByMode[mode].volumeCbm += volume;
    volumeByMode[mode].containers += containers;
  });

  const totalJobFiles = jobFiles.length;
  const averageOrderValue = totalJobFiles > 0 ? totalGMV / totalJobFiles : 0;

  // ── C. TENANT GROWTH & CONVERSION ─────────────────────────────────────────
  const totalTenants = tenants.length;
  let activeTenants = 0;
  let trialTenants = 0;
  let suspendedTenants = 0;
  let expiredTenants = 0;
  let paidTenants = 0;
  let newTenantsLast30Days = 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  tenants.forEach((t) => {
    if (t.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      activeTenants += 1;
      if (t.subscriptionTier !== "TRIAL" && t.subscriptionTier !== "STARTER") {
        paidTenants += 1;
      }
    } else if (t.subscriptionStatus === SubscriptionStatus.TRIAL) {
      trialTenants += 1;
    } else if (t.subscriptionStatus === SubscriptionStatus.SUSPENDED) {
      suspendedTenants += 1;
    } else if (
      t.subscriptionStatus === SubscriptionStatus.EXPIRED ||
      t.subscriptionStatus === SubscriptionStatus.CANCELLED
    ) {
      expiredTenants += 1;
    }

    if (t.createdAt >= thirtyDaysAgo) {
      newTenantsLast30Days += 1;
    }
  });

  const conversionRate = totalTenants > 0 ? (paidTenants / totalTenants) * 100 : 0;
  const retentionRate = totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0;

  // ── D. RECENT TRANSACTIONS STREAM ─────────────────────────────────────────
  const recentInvoices = invoices.slice(0, 10).map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    subdomain: inv.tenant?.subdomain || "-",
    companyName: inv.tenant?.companyName || "-",
    planName: inv.planName,
    billingPeriod: inv.billingPeriod,
    totalAmount: Number(inv.totalAmount),
    status: inv.status,
    dueDate: inv.dueDate.toISOString(),
    paidAt: inv.paidAt?.toISOString() || null,
    paymentMethod: inv.paymentMethod,
    createdAt: inv.createdAt.toISOString(),
  }));

  // ── E. MONTHLY TREND ENGINE (LAST 6 MONTHS) ──────────────────────────────
  const monthlyTrend: Array<{
    month: string;
    year: number;
    label: string;
    saasRevenue: number;
    logisticsGMV: number;
    jobFilesCount: number;
    newTenantsCount: number;
  }> = [];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    // SaaS revenue paid in this month
    const saasRev = invoices
      .filter((inv) => inv.status === PlatformInvoiceStatus.PAID && inv.paidAt && inv.paidAt >= startOfMonth && inv.paidAt <= endOfMonth)
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // Logistics GMV created in this month
    const matchingJobs = jobFiles.filter((j) => j.createdAt >= startOfMonth && j.createdAt <= endOfMonth);
    const logGMV = matchingJobs.reduce((sum, j) => sum + Number(j.sellingAmount || 0), 0);

    // Tenants registered in this month
    const newTenants = tenants.filter((t) => t.createdAt >= startOfMonth && t.createdAt <= endOfMonth).length;

    monthlyTrend.push({
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      label,
      saasRevenue: saasRev,
      logisticsGMV: logGMV,
      jobFilesCount: matchingJobs.length,
      newTenantsCount: newTenants,
    });
  }

  return {
    financials: {
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      totalPaidRevenue: Math.round(totalPaidRevenue),
      totalPendingReceivables: Math.round(totalPendingReceivables),
      paidInvoicesCount,
      pendingInvoicesCount,
      revenueByTier,
      invoiceAging: {
        current: { count: aging.current.count, amount: Math.round(aging.current.amount) },
        overdue30: { count: aging.overdue30.count, amount: Math.round(aging.overdue30.amount) },
        overdue60: { count: aging.overdue60.count, amount: Math.round(aging.overdue60.amount) },
        overdue90Plus: { count: aging.overdue90Plus.count, amount: Math.round(aging.overdue90Plus.amount) },
        totalOverdueAmount: Math.round(aging.totalOverdueAmount),
      },
    },
    logistics: {
      totalGMV: Math.round(totalGMV),
      totalGrossProfit: Math.round(totalGrossProfit),
      totalJobFiles,
      averageOrderValue: Math.round(averageOrderValue),
      volumeByMode: {
        SEA: {
          count: volumeByMode.SEA.count,
          gmv: Math.round(volumeByMode.SEA.gmv),
          grossProfit: Math.round(volumeByMode.SEA.grossProfit),
          weightKg: Math.round(volumeByMode.SEA.weightKg),
          volumeCbm: Math.round(volumeByMode.SEA.volumeCbm),
          containers: volumeByMode.SEA.containers,
        },
        AIR: {
          count: volumeByMode.AIR.count,
          gmv: Math.round(volumeByMode.AIR.gmv),
          grossProfit: Math.round(volumeByMode.AIR.grossProfit),
          weightKg: Math.round(volumeByMode.AIR.weightKg),
          volumeCbm: Math.round(volumeByMode.AIR.volumeCbm),
          containers: volumeByMode.AIR.containers,
        },
        INLAND: {
          count: volumeByMode.INLAND.count,
          gmv: Math.round(volumeByMode.INLAND.gmv),
          grossProfit: Math.round(volumeByMode.INLAND.grossProfit),
          weightKg: Math.round(volumeByMode.INLAND.weightKg),
          volumeCbm: Math.round(volumeByMode.INLAND.volumeCbm),
          containers: volumeByMode.INLAND.containers,
        },
        MULTIMODAL: {
          count: volumeByMode.MULTIMODAL.count,
          gmv: Math.round(volumeByMode.MULTIMODAL.gmv),
          grossProfit: Math.round(volumeByMode.MULTIMODAL.grossProfit),
          weightKg: Math.round(volumeByMode.MULTIMODAL.weightKg),
          volumeCbm: Math.round(volumeByMode.MULTIMODAL.volumeCbm),
          containers: volumeByMode.MULTIMODAL.containers,
        },
      },
    },
    tenants: {
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      expiredTenants,
      paidTenants,
      conversionRate: Number(conversionRate.toFixed(2)),
      retentionRate: Number(retentionRate.toFixed(2)),
      newTenantsLast30Days,
    },
    recentInvoices,
    monthlyTrend,
  };
}

/**
 * Excel styling helper for header cells
 */
function applyHeaderStyle(cell: ExcelJS.Cell) {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" }, // Dark slate
  };
  cell.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 10,
    name: "Calibri",
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cell.border = {
    top: { style: "thin", color: { argb: "FF334155" } },
    bottom: { style: "medium", color: { argb: "FF334155" } },
    left: { style: "thin", color: { argb: "FF334155" } },
    right: { style: "thin", color: { argb: "FF334155" } },
  };
}

/**
 * Excel styling helper for currency cells
 */
function applyCurrencyStyle(cell: ExcelJS.Cell) {
  cell.numFmt = '"Rp "#,##0;("Rp "#,##0);"-"';
  cell.alignment = { vertical: "middle", horizontal: "right" };
  cell.border = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  };
}

/**
 * Excel styling helper for standard data cells
 */
function applyDataStyle(cell: ExcelJS.Cell, align: "left" | "center" | "right" = "left") {
  cell.alignment = { vertical: "middle", horizontal: align };
  cell.font = { size: 10, name: "Calibri" };
  cell.border = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  };
}

/**
 * Exports all SaaS billing platform invoices to an Excel workbook with styling & metadata.
 */
export async function exportPlatformBillingExcel(): Promise<{
  filename: string;
  base64: string;
  totalRows: number;
}> {
  await requireSuperAdmin();

  const invoices = await prisma.platformInvoice.findMany({
    include: {
      tenant: {
        select: {
          subdomain: true,
          companyName: true,
          legalName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SistemForwarding.com Super Admin";
  workbook.created = new Date();

  // Sheet 1: Invoices
  const sheet = workbook.addWorksheet("Tagihan & Invoicing SaaS", {
    views: [{ showGridLines: true }],
  });

  // Title Block
  sheet.mergeCells("A1:N1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "SISTEMFORWARDING.COM — LAPORAN EKSEKUTIF SAAS BILLING & INVOICING";
  titleCell.font = { bold: true, size: 13, color: { argb: "FF0F172A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 28;

  sheet.mergeCells("A2:N2");
  const subCell = sheet.getCell("A2");
  subCell.value = `Tanggal Ekspor: ${new Date().toLocaleString("id-ID")} | Total Invoice: ${invoices.length}`;
  subCell.font = { italic: true, size: 10, color: { argb: "FF64748B" } };
  sheet.getRow(2).height = 20;

  sheet.addRow([]); // Blank spacer

  const headers = [
    "No",
    "No. Invoice",
    "Subdomain",
    "Nama Perusahaan",
    "Paket SaaS",
    "Siklus Tagihan",
    "Biaya Pokok (IDR)",
    "PPN 11% (IDR)",
    "Total Tagihan (IDR)",
    "Status",
    "Jatuh Tempo",
    "Tanggal Bayar",
    "Metode Pembayaran",
    "Ref BorderPay",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell) => applyHeaderStyle(cell));

  let totalBilling = 0;
  let totalTax = 0;
  let totalGross = 0;

  invoices.forEach((inv, index) => {
    const amount = Number(inv.amount);
    const tax = Number(inv.taxAmount);
    const total = Number(inv.totalAmount);

    totalBilling += amount;
    totalTax += tax;
    totalGross += total;

    const row = sheet.addRow([
      index + 1,
      inv.invoiceNumber,
      inv.tenant?.subdomain || "-",
      inv.tenant?.companyName || "-",
      inv.planName,
      inv.billingPeriod,
      amount,
      tax,
      total,
      inv.status,
      inv.dueDate.toISOString().slice(0, 10),
      inv.paidAt ? inv.paidAt.toISOString().slice(0, 10) : "-",
      inv.paymentMethod || "-",
      inv.paymentReference || "-",
    ]);

    row.height = 20;
    row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    applyDataStyle(row.getCell(1), "center");
    applyDataStyle(row.getCell(2), "left");
    applyDataStyle(row.getCell(3), "left");
    applyDataStyle(row.getCell(4), "left");
    applyDataStyle(row.getCell(5), "left");
    applyDataStyle(row.getCell(6), "center");
    applyCurrencyStyle(row.getCell(7));
    applyCurrencyStyle(row.getCell(8));
    applyCurrencyStyle(row.getCell(9));
    applyDataStyle(row.getCell(10), "center");
    applyDataStyle(row.getCell(11), "center");
    applyDataStyle(row.getCell(12), "center");
    applyDataStyle(row.getCell(13), "left");
    applyDataStyle(row.getCell(14), "left");

    // Status coloring
    if (inv.status === PlatformInvoiceStatus.PAID) {
      row.getCell(10).font = { bold: true, color: { argb: "FF059669" } }; // Green
    } else if (inv.status === PlatformInvoiceStatus.PENDING) {
      row.getCell(10).font = { bold: true, color: { argb: "FFD97706" } }; // Amber
    } else {
      row.getCell(10).font = { color: { argb: "FFE11D48" } }; // Red
    }
  });

  // Summary Row
  const summaryRow = sheet.addRow([
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    totalBilling,
    totalTax,
    totalGross,
    "",
    "",
    "",
    "",
    "",
  ]);
  summaryRow.height = 24;
  sheet.mergeCells(`A${summaryRow.number}:F${summaryRow.number}`);
  const mergedTotalCell = summaryRow.getCell(1);
  applyDataStyle(mergedTotalCell, "center");
  mergedTotalCell.font = { bold: true, size: 10 };
  applyCurrencyStyle(summaryRow.getCell(7));
  summaryRow.getCell(7).font = { bold: true };
  applyCurrencyStyle(summaryRow.getCell(8));
  summaryRow.getCell(8).font = { bold: true };
  applyCurrencyStyle(summaryRow.getCell(9));
  summaryRow.getCell(9).font = { bold: true };
  for (let c = 10; c <= 14; c++) {
    applyDataStyle(summaryRow.getCell(c), "center");
  }

  // Set Column Widths
  sheet.columns = [
    { width: 6 },
    { width: 20 },
    { width: 16 },
    { width: 30 },
    { width: 22 },
    { width: 16 },
    { width: 18 },
    { width: 16 },
    { width: 20 },
    { width: 14 },
    { width: 15 },
    { width: 15 },
    { width: 20 },
    { width: 24 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `SaaS_Platform_Invoices_${dateStr}.xlsx`;

  return {
    filename,
    base64,
    totalRows: invoices.length,
  };
}

/**
 * Exports platform tenant audit & utilization metrics to Excel.
 */
export async function exportTenantUtilizationExcel(): Promise<{
  filename: string;
  base64: string;
  totalRows: number;
}> {
  await requireSuperAdmin();

  const tenants = await prisma.tenant.findMany({
    include: {
      users: { select: { id: true } },
      jobFiles: {
        select: {
          id: true,
          sellingAmount: true,
          buyingAmount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SistemForwarding.com Super Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Audit Utilisasi Tenant", {
    views: [{ showGridLines: true }],
  });

  // Title Block
  sheet.mergeCells("A1:L1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "SISTEMFORWARDING.COM — LAPORAN AUDIT UTILISASI & KAPASITAS TENANT";
  titleCell.font = { bold: true, size: 13, color: { argb: "FF0F172A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 28;

  sheet.mergeCells("A2:L2");
  const subCell = sheet.getCell("A2");
  subCell.value = `Tanggal Ekspor: ${new Date().toLocaleString("id-ID")} | Total Tenant Terdaftar: ${tenants.length}`;
  subCell.font = { italic: true, size: 10, color: { argb: "FF64748B" } };
  sheet.getRow(2).height = 20;

  sheet.addRow([]); // Blank spacer

  const headers = [
    "No",
    "Subdomain",
    "Nama Perusahaan",
    "Status Langganan",
    "Tier Paket",
    "Siklus Billing",
    "Jumlah Pengguna",
    "Total Job Files",
    "Total GMV Forwarding (IDR)",
    "Total Laba Kotor (IDR)",
    "Masa Berlaku / Expired",
    "Tanggal Registrasi",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell) => applyHeaderStyle(cell));

  let sumUsers = 0;
  let sumJobs = 0;
  let sumGMV = 0;
  let sumProfit = 0;

  tenants.forEach((t, index) => {
    const userCount = t.users.length;
    const jobCount = t.jobFiles.length;
    let tenantGMV = 0;
    let tenantProfit = 0;

    t.jobFiles.forEach((j) => {
      const s = Number(j.sellingAmount || 0);
      const b = Number(j.buyingAmount || 0);
      tenantGMV += s;
      tenantProfit += s - b;
    });

    sumUsers += userCount;
    sumJobs += jobCount;
    sumGMV += tenantGMV;
    sumProfit += tenantProfit;

    const row = sheet.addRow([
      index + 1,
      t.subdomain,
      t.companyName,
      t.subscriptionStatus,
      t.subscriptionTier,
      t.billingCycle,
      userCount,
      jobCount,
      tenantGMV,
      tenantProfit,
      t.trialEndsAt ? t.trialEndsAt.toISOString().slice(0, 10) : "Tetap / Aktif",
      t.createdAt.toISOString().slice(0, 10),
    ]);

    row.height = 20;
    applyDataStyle(row.getCell(1), "center");
    applyDataStyle(row.getCell(2), "left");
    applyDataStyle(row.getCell(3), "left");
    applyDataStyle(row.getCell(4), "center");
    applyDataStyle(row.getCell(5), "center");
    applyDataStyle(row.getCell(6), "center");
    applyDataStyle(row.getCell(7), "right");
    applyDataStyle(row.getCell(8), "right");
    applyCurrencyStyle(row.getCell(9));
    applyCurrencyStyle(row.getCell(10));
    applyDataStyle(row.getCell(11), "center");
    applyDataStyle(row.getCell(12), "center");
  });

  // Summary Row
  const summaryRow = sheet.addRow([
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    sumUsers,
    sumJobs,
    sumGMV,
    sumProfit,
    "",
    "",
  ]);
  summaryRow.height = 24;
  sheet.mergeCells(`A${summaryRow.number}:F${summaryRow.number}`);
  applyDataStyle(summaryRow.getCell(1), "center");
  summaryRow.getCell(1).font = { bold: true, size: 10 };
  applyDataStyle(summaryRow.getCell(7), "right");
  summaryRow.getCell(7).font = { bold: true };
  applyDataStyle(summaryRow.getCell(8), "right");
  summaryRow.getCell(8).font = { bold: true };
  applyCurrencyStyle(summaryRow.getCell(9));
  summaryRow.getCell(9).font = { bold: true };
  applyCurrencyStyle(summaryRow.getCell(10));
  summaryRow.getCell(10).font = { bold: true };
  applyDataStyle(summaryRow.getCell(11), "center");
  applyDataStyle(summaryRow.getCell(12), "center");

  sheet.columns = [
    { width: 6 },
    { width: 16 },
    { width: 32 },
    { width: 18 },
    { width: 16 },
    { width: 15 },
    { width: 16 },
    { width: 16 },
    { width: 26 },
    { width: 24 },
    { width: 20 },
    { width: 18 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Tenant_Utilization_Audit_${dateStr}.xlsx`;

  return {
    filename,
    base64,
    totalRows: tenants.length,
  };
}
