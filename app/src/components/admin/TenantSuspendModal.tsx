"use client";

import { useState } from "react";
import { AdminTenantItem } from "@/actions/adminTenantActions";
import { AlertTriangle, Ban, CheckCircle2, Loader2, X } from "lucide-react";

interface TenantSuspendModalProps {
  tenant: AdminTenantItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tenantId: string, suspend: boolean, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export function TenantSuspendModal({
  tenant,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: TenantSuspendModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen || !tenant) return null;

  const isCurrentlySuspended = !tenant.isActive || tenant.subscriptionStatus === "SUSPENDED";
  const actionSuspend = !isCurrentlySuspended;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(tenant.id, actionSuspend, reason);
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                actionSuspend
                  ? "bg-rose-950/80 text-rose-400 border border-rose-800"
                  : "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
              }`}
            >
              {actionSuspend ? <Ban className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {actionSuspend ? "Tangguhkan (Suspend) Tenant" : "Aktifkan Kembali Tenant"}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">{tenant.companyName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {actionSuspend ? (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Perhatian:</span> Menangguhkan tenant akan memblokir
                seluruh pengguna di subdomain <span className="font-mono text-white">{tenant.subdomain}.sistemforwarding.com</span> dari
                akses ke dashboard operasional hingga diaktifkan kembali.
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Ruang kerja <span className="font-bold text-white">{tenant.companyName}</span> akan dipulihkan
                menjadi aktif. Pengguna tenant akan dapat kembali masuk dan mengoperasikan job file kargo.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Alasan / Catatan Audit (Opsional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                actionSuspend
                  ? "Contoh: Menunggu konfirmasi pembayaran faktur perpanjangan"
                  : "Contoh: Pembayaran telah terverifikasi oleh finance"
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all border border-zinc-700"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                actionSuspend
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
              }`}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {actionSuspend
                  ? "Konfirmasi Suspend Tenant"
                  : "Konfirmasi Aktifkan Tenant"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
