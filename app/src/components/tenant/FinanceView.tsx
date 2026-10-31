"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FinanceDashboardStats,
  generateInvoice,
  updatePaymentStatus,
} from "@/actions/financeActions";
import {
  TrendingUp,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Ship,
  DollarSign,
  ChevronRight,
  CreditCard,
  FileText,
  Printer,
} from "lucide-react";

interface FinanceViewProps {
  stats: FinanceDashboardStats;
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FinanceView({ stats }: FinanceViewProps) {
  const [isPending, startTransition] = useTransition();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleGenerateInvoice = (jobFileId: string, jobFileNumber: string) => {
    setActiveJobId(jobFileId);
    setFeedback(null);

    startTransition(async () => {
      const result = await generateInvoice(jobFileId);
      setActiveJobId(null);

      if (result.success) {
        setFeedback({
          type: "success",
          message: `Invoice ${result.invoiceNumber} berhasil diterbitkan untuk Job File ${jobFileNumber} sebesar ${formatIDR(result.totalAmount || 0)} (termasuk PPN 1.1%).`,
        });
      } else {
        setFeedback({
          type: "error",
          message: result.error || "Gagal membuat invoice.",
        });
      }
    });
  };

  const handleMarkAsPaid = (invoiceId: string, invoiceNumber: string) => {
    startTransition(async () => {
      const result = await updatePaymentStatus(invoiceId, "PAID", "Transfer Bank / Manual");
      if (result.success) {
        setFeedback({
          type: "success",
          message: `Invoice ${invoiceNumber} berhasil ditandai Lunas. Status piutang dan Job File telah disinkronkan.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: result.error || "Gagal memperbarui status pelunasan.",
        });
      }
    });
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER BANNER */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#121620] p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Modul Keuangan &amp; Invoicing (AP/AR)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
              Enterprise Billing
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manajemen penagihan piutang customer (Selling), pelunasan hutang vendor carrier (Buying), dan penerbitan invoice resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/api/${stats.tenant.subdomain}/export/invoices`}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all"
            title="Download Daftar Invoice Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Download Excel</span>
          </a>

          <Link
            href={`/${stats.tenant.subdomain}/finance/reports`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/30 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-all"
          >
            <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>Laporan P&amp;L</span>
          </Link>

          <div className="hidden sm:flex px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>Invoicing &amp; Billing</span>
          </div>
        </div>
      </div>

      {/* Global Action Feedback Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {feedback.type === "success" ? "Operasi Finansial Berhasil" : "Operasi Terkendala"}
              </p>
              <p className="text-xs mt-0.5">{feedback.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. DASHBOARD WIDGET: FINANCIAL STATS & GROSS PROFIT MARGIN */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* WIDGET 1: Total AR (Piutang Customer / Selling) */}
        <div className="bg-white dark:bg-[#121620] p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total AR (Piutang Customer)
            </span>
            <div className="h-9 w-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {formatIDR(stats.totalAR)}
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Akumulasi nilai penjualan kargo
          </p>
          <div className="w-full bg-blue-100 dark:bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full w-full" />
          </div>
        </div>

        {/* WIDGET 2: Total AP (Hutang Vendor Carrier / Buying) */}
        <div className="bg-white dark:bg-[#121620] p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total AP (Hutang Vendor)
            </span>
            <div className="h-9 w-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {formatIDR(stats.totalAP)}
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Biaya shipping line, trucking, airline
          </p>
          <div className="w-full bg-amber-100 dark:bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full"
              style={{
                width: `${stats.totalAR > 0 ? (stats.totalAP / stats.totalAR) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* WIDGET 3: Gross Profit & Margin Visual Progress */}
        <div className="bg-white dark:bg-[#121620] p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gross Profit (Laba Kotor)
            </span>
            <div className="h-9 w-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatIDR(stats.grossProfit)}
            </h2>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-500/30">
              {stats.grossProfitMargin}% Margin
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Selisih bersih (Selling - Buying)
          </p>
          <div className="w-full bg-emerald-100 dark:bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(stats.grossProfitMargin, 100)}%` }}
            />
          </div>
        </div>

        {/* WIDGET 4: Invoicing Ratio & Pending Queue */}
        <div className="bg-white dark:bg-[#121620] p-6 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Antrean Tagihan
            </span>
            <div className="h-9 w-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-300 tracking-tight">
              {stats.unbilledJobsCount}
            </h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Job File Belum Ditagihkan
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {stats.totalInvoicesCount} Invoice telah resmi terbit
          </p>
          <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full"
              style={{
                width: `${
                  stats.unbilledJobsCount + stats.totalInvoicesCount > 0
                    ? (stats.totalInvoicesCount / (stats.unbilledJobsCount + stats.totalInvoicesCount)) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. PENDING INVOICES: JOB FILES MENUNGGU DITAGIHKAN */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Job File Menunggu Penagihan (Pending Invoices)
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/30">
                {stats.unbilledJobs.length} Menunggu
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik &quot;Generate Invoice&quot; untuk mengalokasikan nomor urut MasterPrefix dan mencatat PPN 1.1% otomatis.
            </p>
          </div>
        </div>

        {/* Card-based Feed of Unbilled Job Files (Strictly NO HTML <table>) */}
        <div className="flex flex-col gap-3">
          {stats.unbilledJobs.length > 0 ? (
            stats.unbilledJobs.map((job) => {
              const subtotal = job.sellingAmount;
              const tax = Math.round(subtotal * 0.011);
              const total = subtotal + tax;
              const isCurrentPending = isPending && activeJobId === job.id;

              return (
                <div
                  key={job.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] hover:border-blue-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                        {job.jobFileNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {job.transportMode}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {job.customer.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleGenerateInvoice(job.id, job.jobFileNumber)}
                      className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all"
                    >
                      {isCurrentPending ? (
                        <>
                          <svg
                            className="animate-spin h-3.5 w-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          <span>Membuat...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 text-blue-200" />
                          <span>Generate Invoice</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
                    <div className="text-slate-500 dark:text-slate-400">
                      Rute: <strong className="text-slate-700 dark:text-slate-300">{job.originPort.split(" ")[0]} &rarr; {job.destinationPort.split(" ")[0]}</strong>
                      <span className="ml-2 font-mono text-[11px]">({job.packageCount} {job.packageType})</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Subtotal</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatIDR(subtotal)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">PPN 1.1%</span>
                        <span className="font-semibold text-emerald-600">+{formatIDR(tax)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Tagihan</span>
                        <span className="font-black text-slate-900 dark:text-white">{formatIDR(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              Semua Job File aktif telah berhasil diterbitkan invoicenya.
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. ACTIVE INVOICES: DAFTAR INVOICE RESMI TERBIT (CARD-BASED) */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Invoice Terbit (MasterPrefix INVOICE)
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 border border-violet-200/60 dark:border-violet-500/30">
                {stats.recentInvoices.length} Terdaftar
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Invoice resmi yang telah dialokasikan nomor uniknya dan siap ditagihkan ke klien atau dilunasi.
            </p>
          </div>
        </div>

        {/* Card-based Feed of Invoices */}
        <div className="flex flex-col gap-3">
          {stats.recentInvoices.length > 0 ? (
            stats.recentInvoices.map((inv) => {
              const isPaid = inv.status === "PAID";
              return (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] hover:border-violet-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {inv.customerName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        (Ref: {inv.jobFileNumber})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isPaid ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                          }`}
                        />
                        {inv.status}
                      </span>

                      {/* Cetak PDF Button */}
                      <a
                        href={`/api/${stats.tenant.subdomain}/invoice/${inv.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 shadow-2xs transition-colors"
                        title="Cetak Faktur Pajak / Invoice PDF"
                      >
                        <Printer className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        <span>Cetak PDF</span>
                      </a>

                      {!isPaid && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleMarkAsPaid(inv.id, inv.invoiceNumber)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Tandai Lunas</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      Jatuh Tempo: {formatDate(inv.dueDate)}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Subtotal</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300">{formatIDR(inv.subtotal)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Tagihan</span>
                        <span className="font-black text-slate-900 dark:text-white font-mono">{formatIDR(inv.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada invoice yang diterbitkan. Silakan generate dari antrean Job File di atas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
