"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  CreditCard,
  Sparkles,
  X,
  ChevronRight,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { TenantSubscriptionInfo } from "@/actions/tenantSubscriptionActions";
import { SubscriptionPaymentModal } from "./SubscriptionPaymentModal";

interface SubscriptionAlertBannerProps {
  subdomain: string;
  subscriptionInfo: TenantSubscriptionInfo | null;
}

export function SubscriptionAlertBanner({
  subdomain,
  subscriptionInfo,
}: SubscriptionAlertBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!subscriptionInfo || dismissed) {
    return null;
  }

  const {
    subscriptionStatus,
    daysRemaining,
    isExpiringSoon,
    isUrgent,
    isExpired,
    formattedExpiryDate,
    pendingInvoice,
  } = subscriptionInfo;

  // Jika langganan masih aman (> 7 hari) dan tidak ada pending invoice, jangan tampilkan banner
  if (!pendingInvoice && !isExpired && !isExpiringSoon) {
    return null;
  }

  return (
    <>
      <div className="w-full px-3.5 sm:px-6 lg:px-8 pt-3 pb-1">
        {pendingInvoice ? (
          /* Case 1: Terdapat Tagihan Pending */
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 border border-indigo-500/40 p-3.5 sm:p-4 text-white shadow-md shadow-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                    Tagihan Menunggu Pembayaran
                  </span>
                  <span className="text-[11px] text-indigo-300 font-mono">
                    {pendingInvoice.invoiceNumber}
                  </span>
                </div>
                <p className="text-xs text-indigo-100 font-medium truncate">
                  Total tagihan: <strong>Rp {pendingInvoice.totalAmount.toLocaleString("id-ID")}</strong> (Jatuh tempo: {pendingInvoice.formattedDueDate}).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Bayar Sekarang (QRIS)</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="p-1.5 rounded-xl text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Tutup banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : isExpired ? (
          /* Case 2: Masa Langganan Telah Berakhir (High Urgency) */
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950 via-red-950 to-rose-900 border border-rose-500/50 p-3.5 sm:p-4 text-white shadow-lg shadow-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white">
                    Langganan Berakhir
                  </span>
                  <span className="text-[11px] text-rose-200">
                    Kedaluwarsa sejak {formattedExpiryDate || "hari ini"}
                  </span>
                </div>
                <p className="text-xs text-rose-100 font-medium">
                  Masa aktif ruang kerja Anda telah habis. Perpanjang sekarang agar akses pembuatan Job File dan pencetakan dokumen kargo tidak terhenti.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-900 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Aktifkan Kembali Sekarang</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Case 3: Menjelang Habis (≤ 7 Hari Tersisa) */
          <div
            className={`relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isUrgent
                ? "bg-gradient-to-r from-amber-950 via-amber-900 to-yellow-950 border-amber-500/50 shadow-amber-950/20"
                : "bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border-blue-500/40 shadow-slate-900/20"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isUrgent
                    ? "bg-amber-500/20 border border-amber-400/40 text-amber-300"
                    : "bg-blue-500/20 border border-blue-400/40 text-blue-300"
                }`}
              >
                {isUrgent ? <Flame className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      isUrgent
                        ? "bg-amber-500/30 text-amber-200 border border-amber-400/40"
                        : "bg-blue-500/30 text-blue-200 border border-blue-400/40"
                    }`}
                  >
                    {subscriptionStatus === "TRIAL" ? "Masa Uji Coba" : "Masa Berlangganan"}
                  </span>
                  <span className="text-[11px] font-bold text-amber-300">
                    Tersisa {daysRemaining} Hari
                  </span>
                </div>
                <p className="text-xs text-slate-100 font-medium">
                  {subscriptionStatus === "TRIAL"
                    ? `Masa trial 7 hari Anda berakhir pada ${formattedExpiryDate}. Tingkatkan ke paket berbayar untuk menjaga kelangsungan operasional forwarding.`
                    : `Langganan Anda akan jatuh tempo pada ${formattedExpiryDate}. Lakukan perpanjangan agar sistem tetap berjalan otomatis.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  isUrgent
                    ? "bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
                }`}
              >
                <span>Perpanjang Sekarang</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              {!isUrgent && (
                <button
                  type="button"
                  onClick={() => setDismissed(true)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Tutup banner"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment / Renewal Checkout Modal */}
      <SubscriptionPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subdomain={subdomain}
        subscriptionInfo={subscriptionInfo}
      />
    </>
  );
}
