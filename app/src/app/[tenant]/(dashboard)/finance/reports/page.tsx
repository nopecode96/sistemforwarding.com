export const dynamic = "force-dynamic";

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FinancialReportsView, MonthlyPLItem, OutstandingInvoiceItem } from "@/components/tenant/FinancialReportsView";

interface ReportsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

async function ReportsContent({ params }: ReportsPageProps) {
  const { tenant: subdomain } = await params;

  // 1. Resolve Tenant
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { id: true, subdomain: true, companyName: true },
  });

  if (!tenant) {
    notFound();
  }

  // 2. Fetch all Job Files for P&L calculations (Strictly from PostgreSQL)
  const [jobs, invoices] = await Promise.all([
    prisma.jobFile.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        jobFileNumber: true,
        transportMode: true,
        bizMode: true,
        sellingAmount: true,
        buyingAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { tenantId: tenant.id, status: { not: "PAID" } },
      include: {
        customer: { select: { name: true, customerCode: true, phone: true } },
        jobFile: { select: { jobFileNumber: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  // 3. Compute Macro Summary
  const totalRevenue = jobs.reduce((acc, j) => acc + Number(j.sellingAmount), 0);
  const totalCost = jobs.reduce((acc, j) => acc + Number(j.buyingAmount), 0);
  const grossProfit = totalRevenue - totalCost;
  const overallMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // 4. Compute Breakdown By Mode (SEA, AIR, INLAND)
  const byMode = {
    sea: { revenue: 0, cost: 0, profit: 0, margin: 0, count: 0 },
    air: { revenue: 0, cost: 0, profit: 0, margin: 0, count: 0 },
    inland: { revenue: 0, cost: 0, profit: 0, margin: 0, count: 0 },
  };

  jobs.forEach((j) => {
    const mode = (j.bizMode || j.transportMode || "SEA").toString().toUpperCase();
    const sell = Number(j.sellingAmount) || 0;
    const buy = Number(j.buyingAmount) || 0;

    if (mode === "AIR") {
      byMode.air.revenue += sell;
      byMode.air.cost += buy;
      byMode.air.count += 1;
    } else if (mode === "INLAND") {
      byMode.inland.revenue += sell;
      byMode.inland.cost += buy;
      byMode.inland.count += 1;
    } else {
      byMode.sea.revenue += sell;
      byMode.sea.cost += buy;
      byMode.sea.count += 1;
    }
  });

  // Calculate profit and margins
  (["sea", "air", "inland"] as const).forEach((k) => {
    byMode[k].profit = byMode[k].revenue - byMode[k].cost;
    byMode[k].margin =
      byMode[k].revenue > 0 ? (byMode[k].profit / byMode[k].revenue) * 100 : 0;
  });

  // 5. Group by Year-Month for Monthly Progression
  const monthMap = new Map<string, MonthlyPLItem>();

  jobs.forEach((j) => {
    const d = new Date(j.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        monthKey: key,
        monthLabel: label,
        seaRevenue: 0,
        seaCost: 0,
        seaProfit: 0,
        airRevenue: 0,
        airCost: 0,
        airProfit: 0,
        inlandRevenue: 0,
        inlandCost: 0,
        inlandProfit: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        marginPercent: 0,
        jobCount: 0,
      });
    }

    const m = monthMap.get(key)!;
    m.jobCount += 1;
    const sell = Number(j.sellingAmount) || 0;
    const buy = Number(j.buyingAmount) || 0;
    const mode = (j.bizMode || j.transportMode || "SEA").toString().toUpperCase();

    if (mode === "AIR") {
      m.airRevenue += sell;
      m.airCost += buy;
    } else if (mode === "INLAND") {
      m.inlandRevenue += sell;
      m.inlandCost += buy;
    } else {
      m.seaRevenue += sell;
      m.seaCost += buy;
    }

    m.totalRevenue += sell;
    m.totalCost += buy;
  });

  // Finalize monthly profits & margins
  const monthlyData = Array.from(monthMap.values()).map((m) => {
    m.seaProfit = m.seaRevenue - m.seaCost;
    m.airProfit = m.airRevenue - m.airCost;
    m.inlandProfit = m.inlandRevenue - m.inlandCost;
    m.totalProfit = m.totalRevenue - m.totalCost;
    m.marginPercent = m.totalRevenue > 0 ? (m.totalProfit / m.totalRevenue) * 100 : 0;
    return m;
  });

  // Sort months descending
  monthlyData.sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // 6. Compute AR Aging (Tagihan Jatuh Tempo)
  const now = new Date();
  let totalOutstanding = 0;
  let currentAmount = 0;
  let overdue1to30 = 0;
  let overdue30Plus = 0;

  const invoiceItems: OutstandingInvoiceItem[] = invoices.map((inv) => {
    const due = new Date(inv.dueDate);
    const total = Number(inv.totalAmount) || 0;
    totalOutstanding += total;

    const diffMs = now.getTime() - due.getTime();
    const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const isOverdue = daysOverdue > 0;

    if (!isOverdue) {
      currentAmount += total;
    } else if (daysOverdue <= 30) {
      overdue1to30 += total;
    } else {
      overdue30Plus += total;
    }

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer.name,
      customerCode: inv.customer.customerCode,
      customerPhone: inv.customer.phone || null,
      jobFileNumber: inv.jobFile?.jobFileNumber || "-",
      invoiceDate: inv.invoiceDate.toISOString(),
      dueDate: inv.dueDate.toISOString(),
      totalAmount: total,
      daysOverdue: Math.max(0, daysOverdue),
      isOverdue,
      status: inv.status,
    };
  });

  return (
    <FinancialReportsView
      tenantSubdomain={tenant.subdomain}
      companyName={tenant.companyName}
      summary={{
        totalRevenue,
        totalCost,
        grossProfit,
        overallMarginPercent,
        totalJobsCount: jobs.length,
      }}
      byMode={byMode}
      monthlyData={monthlyData}
      arAging={{
        totalOutstanding,
        currentAmount,
        overdue1to30,
        overdue30Plus,
        invoices: invoiceItems,
      }}
    />
  );
}

export default function FinancialReportsPage(props: ReportsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            Mengompilasi Laporan Laba Rugi &amp; AR Aging Realtime...
          </p>
        </div>
      }
    >
      <ReportsContent {...props} />
    </Suspense>
  );
}
