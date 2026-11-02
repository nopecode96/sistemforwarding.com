"use client";

import { useState, useMemo, useTransition } from "react";
import {
  AdminBillingOverview,
  AdminPlatformInvoice,
  cancelPlatformInvoice,
  reconcileBorderPayPayment,
} from "@/actions/adminBillingActions";
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Layers,
  Eye,
  Ban,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { GenerateInvoiceModal } from "./GenerateInvoiceModal";
import { InvoiceDetailModal } from "./InvoiceDetailModal";
import { InvoicePaymentApprovalModal } from "./InvoicePaymentApprovalModal";

interface BillingManagementViewProps {
  initialOverview: AdminBillingOverview;
}

export function BillingManagementView({ initialOverview }: BillingManagementViewProps) {
  const [invoices, setInvoices] = useState<AdminPlatformInvoice[]>(initialOverview.invoices);
  const [plans] = useState(initialOverview.plans);
  const [tenants, setTenants] = useState(initialOverview.tenants);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminPlatformInvoice | null>(null);

  // Quick Reconcile Modal / prompt state
  const [isReconcilePromptOpen, setIsReconcilePromptOpen] = useState(false);
  const [reconcileRefInput, setReconcileRefInput] = useState("");

  // Toast notification
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Dynamic Metrics Recalculation
  const metrics = useMemo(() => {
    let revenue = 0;
    let paidCount = 0;
    let receivables = 0;
    let pendingCount = 0;
    let expiredCount = 0;
    let cancelledCount = 0;

    for (const inv of invoices) {
      if (inv.status === "PAID") {
        revenue += inv.totalAmount;
        paidCount++;
      } else if (inv.status === "PENDING") {
        receivables += inv.totalAmount;
        pendingCount++;
      } else if (inv.status === "EXPIRED") {
        expiredCount++;
      } else if (inv.status === "CANCELLED") {
        cancelledCount++;
      }
    }

    return {
      totalRevenue: revenue,
      paidInvoicesCount: paidCount,
      pendingReceivables: receivables,
      pendingInvoicesCount: pendingCount,
      expiredInvoicesCount: expiredCount,
      cancelledInvoicesCount: cancelledCount,
      activePlansCount: plans.filter((p) => p.isActive).length,
    };
  }, [invoices, plans]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesTenant = inv.tenant.companyName.toLowerCase().includes(q);
        const matchesSub = inv.tenant.subdomain.toLowerCase().includes(q);
        const matchesPlan = inv.planName.toLowerCase().includes(q);
        if (!matchesNum && !matchesTenant && !matchesSub && !matchesPlan) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  const handleInvoiceCreated = (newInv: AdminPlatformInvoice) => {
    setInvoices((prev) => [newInv, ...prev]);
    setNotification({
      type: "success",
      message: `Invoice "${newInv.invoiceNumber}" berhasil diterbitkan.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePaymentApproved = (invoiceId: string) => {
    const approvedInv = invoices.find((inv) => inv.id === invoiceId);
    if (approvedInv) {
      setTenants((prev) =>
        prev.map((t) =>
          t.id === approvedInv.tenantId
            ? {
                ...t,
                subscriptionStatus: "ACTIVE",
                subscriptionTier: approvedInv.planCode,
              }
            : t
        )
      );
    }
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: "PAID" as const,
              paidAt: new Date().toISOString(),
              paymentMethod: inv.paymentMethod || "MANUAL_APPROVAL",
              tenant: {
                ...inv.tenant,
                subscriptionStatus: "ACTIVE",
                subscriptionTier: inv.planCode,
              },
            }
          : inv
      )
    );
    setNotification({
      type: "success",
      message: "Pembayaran invoice berhasil disetujui & masa aktif tenant diperpanjang.",
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCancelInvoice = (inv: AdminPlatformInvoice) => {
    if (!confirm(`Batalkan invoice "${inv.invoiceNumber}" untuk "${inv.tenant.companyName}"?`)) {
      return;
    }

    startTransition(async () => {
      const res = await cancelPlatformInvoice(inv.id, "Dibatalkan manual oleh Super Administrator");
      if (res.success) {
        setInvoices((prev) =>
          prev.map((item) =>
            item.id === inv.id ? { ...item, status: "CANCELLED" as const } : item
          )
        );
        setNotification({
          type: "success",
          message: res.message || "Invoice berhasil dibatalkan.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Gagal membatalkan invoice.",
        });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  const handleManualReconcile = () => {
    if (!reconcileRefInput.trim()) return;

    startTransition(async () => {
      const res = await reconcileBorderPayPayment(reconcileRefInput.trim());
      if (res.success) {
        setNotification({
          type: "success",
          message: res.message || "Rekonsiliasi pembayaran berhasil.",
        });
        setIsReconcilePromptOpen(false);
        setReconcileRefInput("");
        // Reload invoices in state
        const targetRef = reconcileRefInput.trim();
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.invoiceNumber === targetRef || inv.paymentReference === targetRef
              ? {
                  ...inv,
                  status: "PAID" as const,
                  paidAt: new Date().toISOString(),
                  paymentMethod: "QRIS BorderPay",
                }
              : inv
          )
        );
      } else {
        setNotification({
          type: "error",
          message: res.error || "Gagal memproses rekonsiliasi.",
        });
      }
      setTimeout(() => setNotification(null), 5000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              SaaS Billing & Invoices
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              BorderPay Gateway
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manajemen tagihan langganan multi-tenant, rekonsiliasi BorderPay QRIS, dan persetujuan transfer manual
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsReconcilePromptOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rekonsiliasi BorderPay</span>
          </button>

          <button
            onClick={() => setIsGenerateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Terbitkan Invoice SaaS</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-white text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* 4 Telemetry Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
              Total Pendapatan (Lunas)
            </p>
            <p className="text-xl font-black text-white font-mono mt-1">
              Rp {metrics.totalRevenue.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
              {metrics.paidInvoicesCount} invoice lunas terverifikasi
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
              Piutang Berjalan (Pending)
            </p>
            <p className="text-xl font-black text-amber-400 font-mono mt-1">
              Rp {metrics.pendingReceivables.toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] text-amber-400/80 font-mono mt-0.5">
              {metrics.pendingInvoicesCount} invoice menunggu pembayaran
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Invoices Count */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
              Total Invoice Diterbitkan
            </p>
            <p className="text-xl font-black text-white font-mono mt-1">
              {invoices.length}
            </p>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {metrics.expiredInvoicesCount} kedaluwarsa · {metrics.cancelledInvoicesCount} void
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Active Plans */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
              Paket Aktif Platform
            </p>
            <p className="text-xl font-black text-white font-mono mt-1">
              {metrics.activePlansCount} Paket
            </p>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {tenants.length} tenant terdaftar
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: "Semua Invoice" },
            { key: "PENDING", label: "Menunggu (Pending)" },
            { key: "PAID", label: "Lunas (Paid)" },
            { key: "EXPIRED", label: "Kedaluwarsa" },
            { key: "CANCELLED", label: "Dibatalkan" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === tab.key
                  ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Invoice / Tenant..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold">No. Invoice</th>
                <th className="py-3.5 px-4 font-bold">Tenant</th>
                <th className="py-3.5 px-4 font-bold">Paket & Durasi</th>
                <th className="py-3.5 px-4 font-bold">Total Tagihan</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Jatuh Tempo</th>
                <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-xs">Tidak ada data invoice yang sesuai.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-800/40 transition">
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white">
                          {inv.invoiceNumber}
                        </span>
                        {inv.qrisString && (
                          <span
                            title="Memiliki Dynamic QRIS BorderPay"
                            className="p-0.5 rounded text-emerald-400 bg-emerald-500/10"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {new Date(inv.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </td>

                    {/* Tenant */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-zinc-200">{inv.tenant.companyName}</p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                        {inv.tenant.subdomain}.sistemforwarding.com
                      </span>
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-amber-400">{inv.planName}</span>
                      <p className="text-[10px] text-zinc-500">{inv.billingPeriod}</p>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-zinc-100">
                        Rp {inv.totalAmount.toLocaleString("id-ID")}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {inv.status === "PAID" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          LUNAS
                        </span>
                      )}
                      {inv.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3 animate-pulse" />
                          PENDING
                        </span>
                      )}
                      {inv.status === "EXPIRED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" />
                          EXPIRED
                        </span>
                      )}
                      {inv.status === "CANCELLED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">
                          <Ban className="w-3 h-3" />
                          VOID
                        </span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      {new Date(inv.dueDate).toLocaleDateString("id-ID")}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsDetailOpen(true);
                          }}
                          title="Lihat Detail & QRIS"
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        {inv.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsApprovalOpen(true);
                              }}
                              title="Setujui Pembayaran"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Setujui</span>
                            </button>

                            <button
                              onClick={() => handleCancelInvoice(inv)}
                              title="Batalkan Invoice"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <GenerateInvoiceModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        tenants={tenants}
        plans={plans}
        onCreated={handleInvoiceCreated}
      />

      <InvoiceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        invoice={selectedInvoice}
        onOpenPaymentApproval={(inv) => {
          setSelectedInvoice(inv);
          setIsApprovalOpen(true);
        }}
      />

      <InvoicePaymentApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        invoice={selectedInvoice}
        onSuccess={handlePaymentApproved}
      />

      {/* Reconcile BorderPay Prompt Modal */}
      {isReconcilePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Rekonsiliasi Manual BorderPay</h3>
                <p className="text-[11px] text-zinc-400">
                  Masukkan No. Invoice atau Reference ID BorderPay
                </p>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 text-xs font-semibold mb-1">
                Referensi Pembayaran / Invoice Number
              </label>
              <input
                type="text"
                value={reconcileRefInput}
                onChange={(e) => setReconcileRefInput(e.target.value)}
                placeholder="Contoh: SAAS-202611-1234"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsReconcilePromptOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending || !reconcileRefInput.trim()}
                onClick={handleManualReconcile}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold disabled:opacity-50"
              >
                {isPending ? "Mengecek..." : "Rekonsiliasi Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
