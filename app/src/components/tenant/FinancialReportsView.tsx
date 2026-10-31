"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Ship,
  Plane,
  Truck,
  Calendar,
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  DollarSign,
  PieChart,
} from "lucide-react";

export interface MonthlyPLItem {
  monthKey: string; // "2026-10"
  monthLabel: string; // "Oktober 2026"
  seaRevenue: number;
  seaCost: number;
  seaProfit: number;
  airRevenue: number;
  airCost: number;
  airProfit: number;
  inlandRevenue: number;
  inlandCost: number;
  inlandProfit: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  marginPercent: number;
  jobCount: number;
}

export interface OutstandingInvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerCode: string;
  customerPhone: string | null;
  jobFileNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  daysOverdue: number;
  isOverdue: boolean;
  status: string;
}

export interface FinancialReportsProps {
  tenantSubdomain: string;
  companyName: string;
  summary: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    overallMarginPercent: number;
    totalJobsCount: number;
  };
  byMode: {
    sea: { revenue: number; cost: number; profit: number; margin: number; count: number };
    air: { revenue: number; cost: number; profit: number; margin: number; count: number };
    inland: { revenue: number; cost: number; profit: number; margin: number; count: number };
  };
  monthlyData: MonthlyPLItem[];
  arAging: {
    totalOutstanding: number;
    currentAmount: number;
    overdue1to30: number;
    overdue30Plus: number;
    invoices: OutstandingInvoiceItem[];
  };
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FinancialReportsView({
  tenantSubdomain,
  companyName,
  summary,
  byMode,
  monthlyData,
  arAging,
}: FinancialReportsProps) {
  const [activeTab, setActiveTab] = useState<"pl" | "aging">("pl");

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER BANNER & EXCEL EXPORTS */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-[#121620] p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Laporan Finansial &amp; Profitabilitas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
              P&amp;L + AR Aging
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Rekapitulasi margin laba kotor kargo (Selling vs. Buying) dan penagihan piutang jatuh tempo {companyName}.
          </p>
        </div>

        {/* Action Buttons: Export to Excel */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/api/${tenantSubdomain}/export/reports?type=pl`}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 text-xs font-bold shadow-2xs transition-all"
            title="Download Laporan Laba Rugi Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Excel P&amp;L</span>
          </a>

          <a
            href={`/api/${tenantSubdomain}/export/reports?type=aging`}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 text-xs font-bold shadow-2xs transition-all"
            title="Download Rekap Tagihan Jatuh Tempo Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Excel AR Aging</span>
          </a>

          <Link
            href={`/${tenantSubdomain}/finance`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 hover:bg-slate-200/70 text-xs font-bold transition-all"
          >
            <Receipt className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>Invoicing Hub</span>
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. TAB CONTROLS (P&L vs AR AGING) */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-2xl border border-slate-200/80 dark:border-white/[0.06] w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("pl")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "pl"
              ? "bg-white dark:bg-[#121620] text-violet-700 dark:text-violet-300 shadow-sm border border-slate-200/80 dark:border-white/10"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Laba Rugi (Profit &amp; Loss)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("aging")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "aging"
              ? "bg-white dark:bg-[#121620] text-violet-700 dark:text-violet-300 shadow-sm border border-slate-200/80 dark:border-white/10"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Tagihan Jatuh Tempo (AR Aging)</span>
          {arAging.invoices.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              {arAging.invoices.length}
            </span>
          )}
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PROFIT & LOSS CONTENT */}
      {/* ==================================================================== */}
      {activeTab === "pl" && (
        <div className="space-y-6">
          {/* Top 3 Macro Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Penjualan (Selling AR)
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatIDR(summary.totalRevenue)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Dari {summary.totalJobsCount} Job File operasional
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                HPP Vendor (Buying AP)
              </span>
              <p className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1">
                {formatIDR(summary.totalCost)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Biaya langsung carrier &amp; vendor mitra
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#121620] border border-emerald-200/80 dark:border-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/20 dark:from-[#121620] dark:to-emerald-950/10 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Gross Profit (Laba Kotor)
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatIDR(summary.grossProfit)}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 font-bold">
                <ArrowUpRight className="h-3 w-3" />
                <span>Margin Rata-rata: {summary.overallMarginPercent.toFixed(1)}%</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#121620] border border-violet-200/80 dark:border-violet-500/20 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Efisiensi Margin
              </span>
              <p className="text-xl font-black text-violet-700 dark:text-violet-300 mt-1">
                {summary.overallMarginPercent.toFixed(1)}%
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Kesehatan margin freight forwarding
              </span>
            </div>
          </div>

          {/* Breakdown per Moda Transportasi (Cards - Strictly NO Table) */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-violet-600" />
                  <span>Profitabilitas Berdasarkan Kategori Moda</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Agregasi pendapatan, beban pokok, dan margin kotor kargo laut, kargo udara, dan trucking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sea Freight Card */}
              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                      <Ship className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sea Freight (Laut)</h4>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                        {byMode.sea.count} Transaksi Kargo
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                    {byMode.sea.margin.toFixed(1)}% Margin
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-blue-200/50 dark:border-blue-500/10 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Penjualan:</span>
                    <strong className="text-slate-900 dark:text-white">{formatIDR(byMode.sea.revenue)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Beban Vendor:</span>
                    <span className="text-slate-600 dark:text-slate-300">{formatIDR(byMode.sea.cost)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-blue-200/40 font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400">Gross Profit:</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{formatIDR(byMode.sea.profit)}</span>
                  </div>
                </div>
              </div>

              {/* Air Freight Card */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <Plane className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Air Freight (Udara)</h4>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        {byMode.air.count} Transaksi Kargo
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">
                    {byMode.air.margin.toFixed(1)}% Margin
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-indigo-200/50 dark:border-indigo-500/10 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Penjualan:</span>
                    <strong className="text-slate-900 dark:text-white">{formatIDR(byMode.air.revenue)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Beban Vendor:</span>
                    <span className="text-slate-600 dark:text-slate-300">{formatIDR(byMode.air.cost)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-indigo-200/40 font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400">Gross Profit:</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{formatIDR(byMode.air.profit)}</span>
                  </div>
                </div>
              </div>

              {/* Inland Trucking Card */}
              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Inland / Trucking</h4>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        {byMode.inland.count} Transaksi Kargo
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                    {byMode.inland.margin.toFixed(1)}% Margin
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-amber-200/50 dark:border-amber-500/10 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Penjualan:</span>
                    <strong className="text-slate-900 dark:text-white">{formatIDR(byMode.inland.revenue)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Beban Vendor:</span>
                    <span className="text-slate-600 dark:text-slate-300">{formatIDR(byMode.inland.cost)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-amber-200/40 font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400">Gross Profit:</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{formatIDR(byMode.inland.profit)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rekapitulasi Laba Rugi Bulanan (Card List, NO Table) */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-600" />
                  <span>Rekapitulasi Bulanan (Monthly Progression)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pertumbuhan margin laba kotor per bulan kalender.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {monthlyData.length > 0 ? (
                monthlyData.map((m) => (
                  <div
                    key={m.monthKey}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] hover:border-violet-500/30 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 text-xs font-black font-mono">
                          {m.monthLabel}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {m.jobCount} Job File
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">Gross Profit:</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatIDR(m.totalProfit)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {m.marginPercent.toFixed(1)}% Margin
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/50 dark:border-white/[0.04] text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Revenue</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {formatIDR(m.totalRevenue)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total HPP / Cost</span>
                        <span className="text-slate-600 dark:text-slate-300 font-mono">
                          {formatIDR(m.totalCost)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Laut (Rev / Profit)</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          {formatIDR(m.seaRevenue)} / <strong className="text-emerald-600">{formatIDR(m.seaProfit)}</strong>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Udara (Rev / Profit)</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          {formatIDR(m.airRevenue)} / <strong className="text-emerald-600">{formatIDR(m.airProfit)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Belum ada data transaksi yang tercatat.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: AR AGING (TAGIHAN JATUH TEMPO) */}
      {/* ==================================================================== */}
      {activeTab === "aging" && (
        <div className="space-y-6">
          {/* AR Aging Macro KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Piutang Belum Lunas
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatIDR(arAging.totalOutstanding)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {arAging.invoices.length} invoice aktif
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#121620] border border-emerald-200/80 dark:border-emerald-500/20 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Belum Jatuh Tempo (Current)
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatIDR(arAging.currentAmount)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Dalam batas TOP normal</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#121620] border border-amber-200/80 dark:border-amber-500/20 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Terlambat 1 - 30 Hari
              </span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {formatIDR(arAging.overdue1to30)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Perlu pengingat/reminder</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#121620] border border-red-200/80 dark:border-red-500/20 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                Terlambat &gt; 30 Hari (Kritis)
              </span>
              <p className="text-xl font-black text-red-600 dark:text-red-400 mt-1">
                {formatIDR(arAging.overdue30Plus)}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Wajib penagihan intensif</span>
            </div>
          </div>

          {/* List of Outstanding Invoices (Card-based, NO Table) */}
          <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08] gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600" />
                  <span>Daftar Piutang Jatuh Tempo (AR Aging Invoices)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pantau umur piutang per invoice untuk menjaga arus kas operasional kargo tetap lancar.
                </p>
              </div>

              <a
                href={`/api/${tenantSubdomain}/export/reports?type=aging`}
                download
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 border border-slate-200 dark:border-white/10 transition-colors"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-amber-600" />
                <span>Export Excel</span>
              </a>
            </div>

            <div className="space-y-3">
              {arAging.invoices.length > 0 ? (
                arAging.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.06] hover:border-violet-500/30 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {inv.customerName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 font-mono text-slate-600 dark:text-slate-300">
                          {inv.customerCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {inv.isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="h-3 w-3" />
                            <span>Terlambat {inv.daysOverdue} Hari</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span>Belum Jatuh Tempo</span>
                          </span>
                        )}

                        {/* Cetak PDF Button */}
                        <a
                          href={`/api/${tenantSubdomain}/invoice/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 hover:bg-slate-100 border border-slate-200 dark:border-white/10 shadow-2xs transition-colors"
                          title="Cetak Faktur PDF"
                        >
                          <Printer className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/50 dark:border-white/[0.04] text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Ref. Job File</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                          {inv.jobFileNumber}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Tgl. Terbit</span>
                        <span className="text-slate-600 dark:text-slate-300 font-mono">
                          {formatDate(inv.invoiceDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Jatuh Tempo</span>
                        <strong
                          className={`font-mono ${
                            inv.isOverdue ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {formatDate(inv.dueDate)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Tagihan</span>
                        <strong className="text-slate-900 dark:text-white font-mono text-sm">
                          {formatIDR(inv.totalAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Tidak ada invoice yang berstatus belum lunas saat ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
