"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  TrendingUp,
  DollarSign,
  Building2,
  FileSpreadsheet,
  Download,
  Ship,
  Plane,
  Truck,
  Layers,
  Clock,
  CheckCircle2,
  RefreshCw,
  PieChart as PieIcon,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  PlatformAnalyticsOverview,
  exportPlatformBillingExcel,
  exportTenantUtilizationExcel,
  getPlatformAnalyticsOverview,
} from "@/actions/adminAnalyticsActions";

interface AnalyticsDashboardViewProps {
  initialData: PlatformAnalyticsOverview;
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactIDR(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}Jt`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

const TIER_COLORS = [
  "#F59E0B", // Amber
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

function downloadBase64Excel(base64: string, filename: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

const emptySubscribe = () => () => {};

export function AnalyticsDashboardView({ initialData }: AnalyticsDashboardViewProps) {
  const [data, setData] = useState<PlatformAnalyticsOverview>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportingBilling, setIsExportingBilling] = useState(false);
  const [isExportingTenant, setIsExportingTenant] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const refreshed = await getPlatformAnalyticsOverview();
      setData(refreshed);
    } catch (err) {
      console.error("Gagal menyegarkan data analitik:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportBilling = async () => {
    try {
      setIsExportingBilling(true);
      setExportMessage("Menyiapkan lembar kerja tagihan platform...");
      const result = await exportPlatformBillingExcel();
      downloadBase64Excel(result.base64, result.filename);
      setExportMessage(`Berhasil mengunduh ${result.filename} (${result.totalRows} baris)`);
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err) {
      console.error("Gagal mengunduh tagihan:", err);
      setExportMessage("Gagal mengekspor tagihan SaaS.");
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExportingBilling(false);
    }
  };

  const handleExportTenant = async () => {
    try {
      setIsExportingTenant(true);
      setExportMessage("Menghimpun audit utilisasi ruang kerja tenant...");
      const result = await exportTenantUtilizationExcel();
      downloadBase64Excel(result.base64, result.filename);
      setExportMessage(`Berhasil mengunduh ${result.filename} (${result.totalRows} tenant)`);
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err) {
      console.error("Gagal mengunduh audit tenant:", err);
      setExportMessage("Gagal mengekspor data audit tenant.");
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExportingTenant(false);
    }
  };

  const { financials, logistics, tenants, recentInvoices, monthlyTrend } = data;

  const tierChartData = financials.revenueByTier
    .filter((t) => t.revenue > 0 || t.activeCount > 0)
    .map((t) => ({
      name: t.name,
      value: t.revenue,
      activeCount: t.activeCount,
    }));

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Executive BI Console
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Multi-Tenant Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-amber-400" />
            Eksekutif Analitik & Intelligence Platform
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Sintesis keuangan SaaS platform (MRR/ARR), volume ekosistem freight forwarding global (GMV), utilisasi kapasitas tenant, dan efisiensi penagihan.
          </p>
        </div>

        {/* Global Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 transition-all cursor-pointer disabled:opacity-50"
            title="Segarkan Metrik"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>

          <button
            onClick={handleExportBilling}
            disabled={isExportingBilling}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{isExportingBilling ? "Mengekspor..." : "Unduh Laporan Pembayaran SaaS (.xlsx)"}</span>
          </button>

          <button
            onClick={handleExportTenant}
            disabled={isExportingTenant}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isExportingTenant ? "Memproses..." : "Unduh Audit Utilisasi Tenant (.xlsx)"}</span>
          </button>
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportMessage && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* 1. EXECUTIVE KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR & ARR */}
        <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Monthly Recurring Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatIDR(financials.mrr)}
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80 mt-2">
              <span className="text-zinc-500 font-mono">ARR (Normalized):</span>
              <span className="font-bold text-amber-400 font-mono">{formatIDR(financials.arr)}</span>
            </div>
          </div>
        </div>

        {/* Platform Forwarding GMV */}
        <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Platform Logistics GMV</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatCompactIDR(logistics.totalGMV)}
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80 mt-2">
              <span className="text-zinc-500 font-mono">Total Laba Kotor:</span>
              <span className="font-bold text-emerald-400 font-mono">{formatCompactIDR(logistics.totalGrossProfit)}</span>
            </div>
          </div>
        </div>

        {/* Paid SaaS Invoices Total */}
        <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Pendapatan Terbayar</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatIDR(financials.totalPaidRevenue)}
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80 mt-2">
              <span className="text-zinc-500 font-mono">Invoice Lunas:</span>
              <span className="font-bold text-zinc-300 font-mono">{financials.paidInvoicesCount} transaksi</span>
            </div>
          </div>
        </div>

        {/* Conversion & Active Tenants */}
        <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Konversi & Pertumbuhan</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {tenants.conversionRate}%
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80 mt-2">
              <span className="text-zinc-500 font-mono">Aktif / Total:</span>
              <span className="font-bold text-purple-300 font-mono">
                {tenants.activeTenants} / {tenants.totalTenants} tenant
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FREIGHT MULTIMODAL VOLUME & ECOSYSTEM (SEA vs AIR vs INLAND) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Distribusi Logistik Freight Multimoda Sedunia
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            Total {logistics.totalJobFiles} Job Files di seluruh tenant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SEA FREIGHT CARD */}
          <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 relative space-y-4 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ocean Freight (Laut)</h3>
                  <p className="text-[11px] text-zinc-500 font-mono">FCL & LCL Containerized</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {logistics.volumeByMode.SEA.count} Muatan
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total GMV Laut:</span>
                <span className="font-bold text-white font-mono">{formatIDR(logistics.volumeByMode.SEA.gmv)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Gross Margin Laba:</span>
                <span className="font-bold text-emerald-400 font-mono">{formatIDR(logistics.volumeByMode.SEA.grossProfit)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total Kontainer:</span>
                <span className="font-mono text-zinc-300">{logistics.volumeByMode.SEA.containers} Box/TEU</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total Volume:</span>
                <span className="font-mono text-zinc-300">{logistics.volumeByMode.SEA.volumeCbm.toLocaleString("id-ID")} CBM</span>
              </div>
            </div>
          </div>

          {/* AIR FREIGHT CARD */}
          <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 relative space-y-4 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Air Freight (Udara)</h3>
                  <p className="text-[11px] text-zinc-500 font-mono">IATA Cargo & Express</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {logistics.volumeByMode.AIR.count} Muatan
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total GMV Udara:</span>
                <span className="font-bold text-white font-mono">{formatIDR(logistics.volumeByMode.AIR.gmv)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Gross Margin Laba:</span>
                <span className="font-bold text-emerald-400 font-mono">{formatIDR(logistics.volumeByMode.AIR.grossProfit)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Berat Bruto:</span>
                <span className="font-mono text-zinc-300">{logistics.volumeByMode.AIR.weightKg.toLocaleString("id-ID")} Kg</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Chargeable Vol:</span>
                <span className="font-mono text-zinc-300">{logistics.volumeByMode.AIR.volumeCbm.toLocaleString("id-ID")} CBM</span>
              </div>
            </div>
          </div>

          {/* INLAND TRUCKING CARD */}
          <div className="p-5 rounded-3xl bg-zinc-900/70 border border-zinc-800 relative space-y-4 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Inland Trucking (Darat)</h3>
                  <p className="text-[11px] text-zinc-500 font-mono">Haulage & Distribution</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {logistics.volumeByMode.INLAND.count} Muatan
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total GMV Truk:</span>
                <span className="font-bold text-white font-mono">{formatIDR(logistics.volumeByMode.INLAND.gmv)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Gross Margin Laba:</span>
                <span className="font-bold text-emerald-400 font-mono">{formatIDR(logistics.volumeByMode.INLAND.grossProfit)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Armada / Trip:</span>
                <span className="font-mono text-zinc-300">{logistics.volumeByMode.INLAND.containers} Trip</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Kapasitas Muatan:</span>
                <span className="font-mono text-zinc-300">{logistics.volumeByMode.INLAND.weightKg.toLocaleString("id-ID")} Kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CHARTS: REVENUE BY TIER & MONTHLY TREND */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE BY SUBSCRIPTION TIER */}
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-400" />
                Pendapatan SaaS per Paket
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">Breakdown Tier</span>
            </div>
            <p className="text-xs text-zinc-400">
              Distribusi kontribusi pendapatan langganan platform per tingkatan plan.
            </p>
          </div>

          {/* Donut Chart */}
          <div className="h-48 w-full flex items-center justify-center my-2">
            {mounted && tierChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {tierChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TIER_COLORS[index % TIER_COLORS.length]}
                        stroke="#18181b"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-white">{d.name}</p>
                            <p className="text-amber-400 font-mono">{formatIDR(d.value)}</p>
                            <p className="text-zinc-400 text-[10px]">{d.activeCount} tenant aktif</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-zinc-500 font-mono py-10">
                Memuat visualisasi tier...
              </div>
            )}
          </div>

          {/* Tier Bars List */}
          <div className="space-y-2.5 pt-3 border-t border-zinc-800">
            {financials.revenueByTier.map((tier, idx) => (
              <div key={tier.tier} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: TIER_COLORS[idx % TIER_COLORS.length] }}
                    />
                    <span className="font-medium text-zinc-300">{tier.name}</span>
                  </div>
                  <span className="font-mono text-zinc-400 text-[11px]">
                    {formatIDR(tier.revenue)} ({tier.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, tier.percentage)}%`,
                      backgroundColor: TIER_COLORS[idx % TIER_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MONTHLY TREND ENGINE (SAAS REVENUE VS LOGISTICS GMV) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Tren Pertumbuhan Platform (6 Bulan Terakhir)
              </h3>
              <p className="text-xs text-zinc-400">
                Perbandingan volume transaksi SaaS billing terhadap GMV ekosistem logistik tenant.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                SaaS Billing
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Forwarding GMV
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            {mounted && monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#71717a"
                    fontSize={10}
                    tickFormatter={(val) => formatCompactIDR(val)}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl text-xs space-y-1.5">
                            <p className="font-bold text-white border-b border-zinc-800 pb-1">{d.label}</p>
                            <p className="text-amber-400 font-mono">
                              SaaS: {formatIDR(d.saasRevenue)}
                            </p>
                            <p className="text-blue-400 font-mono">
                              GMV: {formatIDR(d.logisticsGMV)}
                            </p>
                            <div className="pt-1 text-[10px] text-zinc-500 flex justify-between gap-4">
                              <span>Job Files: {d.jobFilesCount}</span>
                              <span>Tenant Baru: +{d.newTenantsCount}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="logisticsGMV"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGMV)"
                  />
                  <Area
                    type="monotone"
                    dataKey="saasRevenue"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSaas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-zinc-500 font-mono py-14">
                Memuat chart performa...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. INVOICE AGING & AR BREAKDOWN */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Platform Invoice Aging Breakdown (Piutang SaaS)
            </h3>
            <p className="text-xs text-zinc-400">
              Umur piutang tagihan langganan tertunggak untuk mitigasi risiko arus kas platform.
            </p>
          </div>
          <div className="text-xs font-mono">
            <span className="text-zinc-500">Total Piutang Berjalan: </span>
            <span className="text-amber-400 font-bold">{formatIDR(financials.totalPendingReceivables)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Current / Lancar */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">Belum Jatuh Tempo</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {formatIDR(financials.invoiceAging.current.amount)}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              {financials.invoiceAging.current.count} invoice lancar
            </p>
          </div>

          {/* 1 - 30 Days */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">Overdue 1 - 30 Hari</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <div className="text-lg font-mono font-bold text-amber-400">
              {formatIDR(financials.invoiceAging.overdue30.amount)}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              {financials.invoiceAging.overdue30.count} invoice terlambat
            </p>
          </div>

          {/* 31 - 60 Days */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">Overdue 31 - 60 Hari</span>
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <div className="text-lg font-mono font-bold text-orange-400">
              {formatIDR(financials.invoiceAging.overdue60.amount)}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              {financials.invoiceAging.overdue60.count} invoice terancam suspend
            </p>
          </div>

          {/* > 60 Days */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">Overdue &gt; 60 Hari</span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <div className="text-lg font-mono font-bold text-rose-400">
              {formatIDR(financials.invoiceAging.overdue90Plus.amount)}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              {financials.invoiceAging.overdue90Plus.count} invoice kritis / macet
            </p>
          </div>
        </div>
      </div>

      {/* 5. RECENT PLATFORM TRANSACTIONS STREAM */}
      <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              Stream Transaksi Platform Terakhir
            </h3>
            <p className="text-xs text-zinc-400">
              Aktivitas pembuatan dan pembayaran invoice platform dari para tenant.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-mono">10 Riwayat Terakhir</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950/80 text-zinc-400 font-mono uppercase tracking-wider text-[10px] border-b border-zinc-800">
                <th className="px-4 py-3">No. Invoice</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Paket SaaS</th>
                <th className="px-4 py-3 text-right">Total Tagihan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3">Metode Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-200">{inv.companyName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{inv.subdomain}.sistemforwarding.com</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <div>{inv.planName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{inv.billingPeriod}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      {formatIDR(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : inv.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-400">
                      {inv.dueDate.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-[11px]">
                      {inv.paymentMethod || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 font-mono">
                    Belum ada invoice transaksi yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
