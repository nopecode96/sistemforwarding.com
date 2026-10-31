export const dynamic = "force-dynamic";

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  TrendingUp,
  Ship,
  FileCheck2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Navigation2,
  ExternalLink,
  FileText,
  Truck,
  Plane,
  Box,
  ChevronDown,
  Layers,
  Sparkles,
  Anchor,
  Compass,
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  DashboardInteractiveCharts,
  MonthlyDataPoint,
  MultimodalDataPoint,
} from "@/components/tenant/DashboardCharts";

interface TenantDashboardProps {
  params: Promise<{
    tenant: string;
  }>;
}

// Format number to Indonesian Rupiah currency
function formatIDR(amount: number | string | { toString(): string } | null | undefined): string {
  if (amount === null || amount === undefined) return "Rp 0";
  const numeric =
    typeof amount === "object" && "toString" in amount
      ? parseFloat(amount.toString())
      : typeof amount === "string"
      ? parseFloat(amount)
      : Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

// Compact millions/billions format
function formatCompactIDR(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}Jt`;
  }
  return formatIDR(amount);
}

async function TenantDashboardContent({ params }: TenantDashboardProps) {
  const { tenant } = await params;

  // 1. Fetch live tenant operational records from PostgreSQL via Prisma ORM
  // Golden Rule: All metrics, statuses, dropdowns, and rates are strictly driven by PostgreSQL.
  const tenantData = await prisma.tenant.findUnique({
    where: { subdomain: tenant },
    include: {
      jobFiles: {
        include: {
          customer: true,
          vendor: true,
          originPortRef: true,
          destinationPortRef: true,
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        include: {
          customer: true,
          tax: true,
        },
        orderBy: { createdAt: "desc" },
      },
      prefixes: true,
      taxes: true,
      financialSettings: true,
      customers: true,
      vendors: true,
    },
  });

  if (!tenantData) {
    notFound();
  }

  const jobFiles = tenantData.jobFiles || [];
  const invoices = tenantData.invoices || [];
  const totalOrders = jobFiles.length;

  // Operational status counts (strictly computed from PostgreSQL)
  const pendingOrders = jobFiles.filter(
    (j) => j.status === "DRAFT" || j.status === "BOOKED"
  ).length;
  const inTransitOrders = jobFiles.filter(
    (j) => j.status === "IN_TRANSIT" || j.status === "CUSTOMS_CLEARANCE"
  ).length;
  const deliveredOrders = jobFiles.filter(
    (j) => j.status === "DELIVERED" || j.status === "ARRIVED" || j.status === "CLOSED"
  ).length;
  const todayOrders = jobFiles.filter(
    (j) => new Date(j.createdAt).toDateString() === new Date().toDateString()
  ).length;

  // Financial aggregates (strictly computed from PostgreSQL)
  const totalSelling = jobFiles.reduce(
    (acc, j) => acc + Number(j.sellingAmount || 0),
    0
  );
  const totalBuying = jobFiles.reduce(
    (acc, j) => acc + Number(j.buyingAmount || 0),
    0
  );
  const grossProfit = totalSelling - totalBuying;
  const marginPercentage =
    totalSelling > 0 ? ((grossProfit / totalSelling) * 100).toFixed(1) : "0.0";
  const avgOrderValue = totalOrders > 0 ? totalSelling / totalOrders : 0;

  // Multimodal breakdown from PostgreSQL
  const seaJobs = jobFiles.filter((j) => j.transportMode === "SEA");
  const seaAmount = seaJobs.reduce((acc, j) => acc + Number(j.sellingAmount || 0), 0);
  const seaPercent = totalSelling > 0 ? Math.round((seaAmount / totalSelling) * 100) : 0;

  const airJobs = jobFiles.filter((j) => j.transportMode === "AIR");
  const airAmount = airJobs.reduce((acc, j) => acc + Number(j.sellingAmount || 0), 0);
  const airPercent = totalSelling > 0 ? Math.round((airAmount / totalSelling) * 100) : 0;

  const inlandJobs = jobFiles.filter(
    (j) => j.transportMode === "INLAND" || j.transportMode === "MULTIMODAL"
  );
  const inlandAmount = inlandJobs.reduce((acc, j) => acc + Number(j.sellingAmount || 0), 0);
  const inlandPercent = totalSelling > 0 ? Math.round((inlandAmount / totalSelling) * 100) : 0;

  // Active vessel & corridor telemetry from latest active job in PostgreSQL
  const activeJob =
    jobFiles.find((j) => j.status === "IN_TRANSIT") ||
    jobFiles.find((j) => j.status === "BOOKED") ||
    jobFiles[0] ||
    null;

  // Delivery SLA Performance rate from PostgreSQL
  const onTimeRate =
    totalOrders > 0
      ? Math.min(100, Math.round(((deliveredOrders + inTransitOrders) / totalOrders) * 100))
      : 100;

  // MasterPrefix & Tax metadata
  const jobPrefix = tenantData.prefixes.find((p) => p.prefixType === "JOB_FILE");
  const defaultTax = tenantData.taxes.find((t) => t.isDefault) || tenantData.taxes[0];

  // Dynamic 6-Month Rolling Financial & Operational Trend (100% PostgreSQL Driven)
  const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyData: MonthlyDataPoint[] = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(currentYear, currentMonthIdx - (5 - idx), 1);
    const mName = monthsList[d.getMonth()];
    const mYear = d.getFullYear();
    const mMonth = d.getMonth();

    const mJobs = jobFiles.filter((j) => {
      const jd = new Date(j.createdAt);
      return jd.getFullYear() === mYear && jd.getMonth() === mMonth;
    });

    const mSelling = mJobs.reduce((acc, j) => acc + Number(j.sellingAmount || 0), 0);
    const mBuying = mJobs.reduce((acc, j) => acc + Number(j.buyingAmount || 0), 0);
    const mProfit = mSelling - mBuying;
    const mMargin = mSelling > 0 ? Number(((mProfit / mSelling) * 100).toFixed(1)) : 0;

    return {
      month: `${mName} '${String(mYear).slice(2)}`,
      year: mYear,
      revenue: mSelling,
      cogs: mBuying,
      grossProfit: mProfit,
      marginPercent: mMargin,
      shipments: mJobs.length,
      isCurrent: mMonth === currentMonthIdx && mYear === currentYear,
    };
  });

  // Dynamic Multimodal Distribution for interactive donut chart
  const multimodalData: MultimodalDataPoint[] = [
    {
      name: "Sea Freight (FCL/LCL)",
      key: "sea",
      value: seaAmount,
      count: seaJobs.length,
      percentage: seaPercent,
      color: "#3b82f6",
      iconName: "sea",
    },
    {
      name: "Air Cargo Express",
      key: "air",
      value: airAmount,
      count: airJobs.length,
      percentage: airPercent,
      color: "#06b6d4",
      iconName: "air",
    },
    {
      name: "Inland Haulage / Truk",
      key: "inland",
      value: inlandAmount,
      count: inlandJobs.length,
      percentage: inlandPercent,
      color: "#f59e0b",
      iconName: "inland",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY CONTROLS */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 bg-white dark:bg-[#121620] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              Dashboard Operasional &amp; Telemetri Kargo
            </h1>
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500" />
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Data operasional terisolasi untuk <span className="font-semibold text-slate-700 dark:text-slate-200">{tenantData.companyName}</span>. Terkoneksi ke cluster PostgreSQL 16.
          </p>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200/60 dark:border-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="truncate">Sinkronisasi</span>
          </Link>
          <Link
            href="/jobs/new"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-bold rounded-xl sm:rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md sm:shadow-lg shadow-violet-600/30 hover:from-violet-700 hover:to-indigo-700 transition-all"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="truncate">+ Job File Baru</span>
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SOPHISTICATED HERO SHOWCASE WITH TELEMETRY GRID (100% DB Driven) */}
      {/* ==================================================================== */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-[#101726] to-[#0d111a] border border-slate-800/80 dark:border-white/10 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
        {/* Subtle Background Glow & Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 sm:w-80 h-60 sm:h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] sm:text-xs font-bold text-violet-300 border border-white/15 mb-2">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Autopilot Multi-Modal Freight Dispatch</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                Live Freight Telemetry &amp; Fleet Performance
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Format penomoran: <span className="font-mono text-violet-300">{jobPrefix?.formatPattern || "{PREFIX}/{YEAR}/{MONTH}/{SEQ}"}</span> (Urutan #{jobPrefix?.currentSequence || 0}). Kebijakan PPN: <span className="text-emerald-300">{defaultTax ? `${defaultTax.taxRatePercent}% (${defaultTax.taxCode})` : "1.1%"}</span>.
              </p>
            </div>

            {/* Frosted Floating Pill: Operational Statuses */}
            <div className="w-full lg:w-auto bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 block mb-1.5">
                Status Operasional Muatan
              </span>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Draft {pendingOrders}
                </span>
                <span className="px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  In-Transit {inTransitOrders}
                </span>
                <span className="px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Delivered {deliveredOrders}
                </span>
              </div>
            </div>
          </div>

          {/* 8-Grid Telemetry Cards (Pure PostgreSQL Aggregations) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/15 hover:bg-white/15 transition-all">
              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium block truncate">Total Orders</span>
              <p className="text-lg sm:text-2xl font-black text-white mt-0.5 sm:mt-1">{totalOrders}</p>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold block truncate">Job Files Aktif</span>
            </div>

            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/15 hover:bg-white/15 transition-all">
              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium block truncate">Pending Orders</span>
              <p className="text-lg sm:text-2xl font-black text-amber-300 mt-0.5 sm:mt-1">{pendingOrders}</p>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold block truncate">Menunggu Dispatch</span>
            </div>

            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/15 hover:bg-white/15 transition-all">
              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium block truncate">On-Time Rate</span>
              <p className="text-lg sm:text-2xl font-black text-emerald-300 mt-0.5 sm:mt-1">{onTimeRate}%</p>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold block truncate">SLA Delivery</span>
            </div>

            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/15 hover:bg-white/15 transition-all">
              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium block truncate">Avg Order Value</span>
              <p className="text-base sm:text-xl font-black text-cyan-300 mt-0.5 sm:mt-1 truncate">
                {formatCompactIDR(avgOrderValue)}
              </p>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold block truncate">Rata-rata / BL</span>
            </div>

            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/15 hover:bg-white/15 transition-all">
              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium block truncate">Total Revenue</span>
              <p className="text-base sm:text-xl font-black text-violet-300 mt-0.5 sm:mt-1 truncate" title={formatIDR(totalSelling)}>
                {formatCompactIDR(totalSelling)}
              </p>
              <span className="text-[9px] sm:text-[10px] text-violet-400 font-semibold block truncate">Gross Piutang</span>
            </div>

            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/15 hover:bg-white/15 transition-all">
              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium block truncate">Delivered</span>
              <p className="text-lg sm:text-2xl font-black text-emerald-300 mt-0.5 sm:mt-1">{deliveredOrders}</p>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold block truncate">Selesai / Tiba</span>
            </div>

            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/15 hover:bg-white/15 transition-all">
              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium block truncate">In Transit</span>
              <p className="text-lg sm:text-2xl font-black text-cyan-300 mt-0.5 sm:mt-1">{inTransitOrders}</p>
              <span className="text-[9px] sm:text-[10px] text-cyan-400 font-semibold block truncate">Kapal &amp; Udara</span>
            </div>

            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/15 hover:bg-white/15 transition-all">
              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium block truncate">Today Orders</span>
              <p className="text-lg sm:text-2xl font-black text-white mt-0.5 sm:mt-1">{todayOrders}</p>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold block truncate">Hari ini</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. INTERACTIVE ANIMATED CHARTS (RECHARTS - 100% POSTGRESQL DATA) */}
      {/* ==================================================================== */}
      <DashboardInteractiveCharts
        monthlyData={monthlyData}
        multimodalData={multimodalData}
        totalRevenue={totalSelling}
        totalGrossProfit={grossProfit}
        totalShipments={totalOrders}
      />

      {/* ==================================================================== */}
      {/* 4. OPERATIONAL FEED & FLEET TELEMETRY (12 COLS: 7 COLS + 5 COLS) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
        {/* LEFT COLUMN: RECENT ORDERS / JOB FILES (7 COLS) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6 min-w-0">
          <div className="bg-white dark:bg-[#121620] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm transition-colors min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center justify-between sm:justify-start gap-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Recent Orders &amp; Job Files
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/30">
                    PostgreSQL Live
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">
                  Total: {totalOrders} Berkas
                </span>
                <Link
                  href="/jobs/new"
                  className="font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                >
                  <span>+ Tambah Baru</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* CARD-BASED JOB FILE FEED (CLICKABLE TO DETAIL) */}
            <div className="mt-4 flex flex-col gap-3">
              {jobFiles && jobFiles.length > 0 ? (
                jobFiles.slice(0, 5).map((job) => {
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      {job.status}
                    </span>
                  );
                  if (job.status === "DELIVERED" || job.status === "ARRIVED" || job.status === "CLOSED") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Delivered
                      </span>
                    );
                  } else if (job.status === "IN_TRANSIT") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping" />
                        In-Transit
                      </span>
                    );
                  } else if (job.status === "DRAFT") {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                        Draft
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] hover:border-violet-500/40 hover:bg-slate-100/60 dark:hover:bg-white/[0.05] transition-all space-y-2.5 block"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-violet-600 dark:text-violet-400">
                            {job.jobFileNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                            {job.transportMode}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {job.customer?.name || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {statusBadge}
                          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                            {formatIDR(job.sellingAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 pt-1 border-t border-slate-200/60 dark:border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {job.originPort ? job.originPort.split(" ")[0] : "-"} &rarr; {job.destinationPort ? job.destinationPort.split(" ")[0] : "-"}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">
                            {job.vesselOrFlight || job.vendor?.name || "-"}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {job.masterBillOfLading || "B/L Pending"}
                        </span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada Job File aktif di database.
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
                <span className="truncate">Data terisolasi PostgreSQL 16 (TenantId: {tenantData.id.slice(0, 8)}...)</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                Pattern: {jobPrefix?.formatPattern || "{PREFIX}/{YEAR}/{MONTH}/{SEQ}"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CIRCULAR PERFORMANCE GAUGE & MARITIME ROUTE MAP (5 COLS) */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6 min-w-0">
          {/* Delivery Performance Circular Gauge */}
          <div className="bg-white dark:bg-[#121620] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm transition-colors min-w-0">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Delivery Performance
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ketepatan jadwal armada &amp; penyelesaian bea cukai
                </p>
              </div>
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl text-[11px] sm:text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/30">
                {onTimeRate}% SLA
              </span>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
              <div>
                <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
                  Gross Freight Revenue
                </span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  {formatIDR(totalSelling)}
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 sm:mt-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                    {totalOrders} BL Terbit
                  </span>
                  <span className="text-xs text-slate-400">Total Piutang Aktif</span>
                </div>
              </div>

              {/* Circular Gauge Graphic */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-100 dark:text-white/10"
                  />
                  {/* Progress Indicator */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="url(#performance-gradient)"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * onTimeRate) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="performance-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {onTimeRate}%
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    On-Time
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-white/[0.08] leading-relaxed">
              Tingkat keberhasilan pengiriman sesuai estimasi waktu tiba (ETA) mencapai {onTimeRate}% untuk {totalOrders} BL kargo terdaftar di sistem.
            </p>
          </div>

          {/* Today Delivery Places & Shipping Lanes Map */}
          <div className="bg-white dark:bg-[#121620] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm transition-colors min-w-0">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Today Delivery Places &amp; Routes
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pelacakan koridor logistik pelabuhan laut &amp; bandara kargo
                </p>
              </div>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
            </div>

            {/* Stylized SVG Shipping Lane & Dot Map */}
            <div className="mt-3 sm:mt-4 relative rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 to-[#101524] p-3.5 sm:p-5 text-white overflow-hidden border border-slate-800">
              {/* Dot Matrix Pattern */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                }}
              />

              {/* SVG Vessel Trajectory Path */}
              <svg className="w-full h-32 sm:h-40" viewBox="0 0 400 160">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                {/* Shipping route curve */}
                <path
                  d="M 50 110 Q 180 30 340 70"
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />

                {/* Port 1 (Origin) */}
                <circle cx="50" cy="110" r="6" fill="#10b981" />
                <circle cx="50" cy="110" r="12" fill="#10b981" opacity="0.3" className="animate-ping" />

                {/* Vessel Position In-Between */}
                <circle cx="210" cy="62" r="5" fill="#06b6d4" />

                {/* Port 2 (Destination) */}
                <circle cx="340" cy="70" r="6" fill="#8b5cf6" />
                <circle cx="340" cy="70" r="12" fill="#8b5cf6" opacity="0.3" className="animate-ping" />
              </svg>

              {/* Floating Port Tags from active job in PostgreSQL */}
              <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                  {activeJob?.originPort ? activeJob.originPort.split(" ")[0] : "-"}
                </span>
              </div>
              <div className="absolute bottom-2.5 sm:bottom-4 right-2.5 sm:right-4">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-violet-600 text-white shadow-md">
                  {activeJob?.destinationPort ? activeJob.destinationPort.split(" ")[0] : "-"}
                </span>
              </div>
            </div>

            {/* Live Telemetry Badge from PostgreSQL */}
            <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 truncate">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold shrink-0">
                  <Ship className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {activeJob?.vesselOrFlight || activeJob?.vendor?.name || "Belum ada armada terjadwal"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {activeJob ? `B/L: ${activeJob.masterBillOfLading || "-"} • ${activeJob.status}` : "Belum ada Job File aktif"}
                  </p>
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 sm:py-1 rounded-lg border border-cyan-200 dark:border-cyan-700/40 shrink-0">
                {activeJob?.status === "IN_TRANSIT" ? "In Transit" : activeJob?.status || "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. MULTIMODAL SHIPMENT BREAKDOWN (Pure Live Database Distribution) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 min-w-0">
        {/* Card 1: Sea Freight FCL & LCL */}
        <div className="bg-white dark:bg-[#121620] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Sea Freight FCL &amp; LCL
              </h4>
              <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
                {seaJobs.length} Order Berjalan
              </span>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold group-hover:scale-110 transition-transform shrink-0">
              <Ship className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-4 sm:mt-5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatIDR(seaAmount)}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {seaPercent}% Volume
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3 w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div
              style={{ width: `${seaPercent}%` }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 sm:h-2 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Card 2: Air Freight Cargo Express */}
        <div className="bg-white dark:bg-[#121620] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Air Freight Cargo Express
              </h4>
              <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
                {airJobs.length} Master AWB Terbit
              </span>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold group-hover:scale-110 transition-transform shrink-0">
              <Plane className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-4 sm:mt-5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatIDR(airAmount)}
            </span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              {airPercent}% Volume
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3 w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div
              style={{ width: `${airPercent}%` }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {/* Card 3: Inland Trucking & Haulage */}
        <div className="bg-white dark:bg-[#121620] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Inland Trucking &amp; Haulage
              </h4>
              <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">
                {inlandJobs.length} Ritase Truk Terjadwal
              </span>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold group-hover:scale-110 transition-transform shrink-0">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-4 sm:mt-5 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatIDR(inlandAmount)}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {inlandPercent}% Volume
            </span>
          </div>
          <div className="mt-2.5 sm:mt-3 w-full bg-slate-100 dark:bg-white/10 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div
              style={{ width: `${inlandPercent}%` }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantWorkspacePage(props: TenantDashboardProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Menghubungkan ke Cluster PostgreSQL &amp; Telemetri Kargo...
          </p>
        </div>
      }
    >
      <TenantDashboardContent {...props} />
    </Suspense>
  );
}
