"use client";

import { useState } from "react";
import { AdminTenantItem } from "@/actions/adminTenantActions";
import { SubscriptionStatus } from "@prisma/client";
import { Sparkles, Loader2, X, AlertCircle } from "lucide-react";

interface TenantPlanModalProps {
  tenant: AdminTenantItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tenantId: string,
    data: {
      subscriptionTier?: string;
      subscriptionStatus?: SubscriptionStatus;
      billingCycle?: string;
      trialEndsAt?: string | null;
    }
  ) => Promise<void>;
  isLoading?: boolean;
}

function TenantPlanModalContent({
  tenant,
  onClose,
  onSave,
  isLoading = false,
}: {
  tenant: AdminTenantItem;
  onClose: () => void;
  onSave: TenantPlanModalProps["onSave"];
  isLoading?: boolean;
}) {
  const [tier, setTier] = useState(tenant.subscriptionTier || "STARTER");
  const [status, setStatus] = useState<SubscriptionStatus>(
    tenant.subscriptionStatus || SubscriptionStatus.TRIAL
  );
  const [billingCycle, setBillingCycle] = useState(tenant.billingCycle || "MONTHLY");
  const [expiryDate, setExpiryDate] = useState(
    tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toISOString().split("T")[0] : ""
  );
  const [error, setError] = useState<string | null>(null);

  const handleQuickAddDays = (days: number) => {
    const base = expiryDate ? new Date(expiryDate) : new Date();
    const target = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setExpiryDate(target.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave(tenant.id, {
        subscriptionTier: tier,
        subscriptionStatus: status,
        billingCycle,
        trialEndsAt: expiryDate ? new Date(expiryDate).toISOString() : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui paket tenant.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Kelola Paket & Masa Aktif</h3>
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
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tier Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Tier / Paket Layanan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["STARTER", "PRO", "ENTERPRISE"].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTier(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all border ${
                    tier === t
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                      : "bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Subscription Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Status Berlangganan
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono"
            >
              <option value={SubscriptionStatus.ACTIVE}>ACTIVE (Berlangganan Penuh)</option>
              <option value={SubscriptionStatus.TRIAL}>TRIAL (Evaluasi Uji Coba)</option>
              <option value={SubscriptionStatus.SUSPENDED}>SUSPENDED (Ditangguhkan)</option>
              <option value={SubscriptionStatus.EXPIRED}>EXPIRED (Kedaluwarsa)</option>
              <option value={SubscriptionStatus.CANCELLED}>CANCELLED (Dibatalkan)</option>
            </select>
          </div>

          {/* Billing Cycle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Siklus Billing
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["MONTHLY", "YEARLY"].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setBillingCycle(c)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-semibold transition-all border ${
                    billingCycle === c
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                      : "bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white"
                  }`}
                >
                  {c === "MONTHLY" ? "Bulanan (Monthly)" : "Tahunan (Yearly)"}
                </button>
              ))}
            </div>
          </div>

          {/* Expiration / Trial Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Tanggal Batas Aktif / Trial
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono"
            />

            {/* Quick date add buttons */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 font-mono">Tambah Cepat:</span>
              <button
                type="button"
                onClick={() => handleQuickAddDays(7)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700"
              >
                +7 Hari
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(14)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700"
              >
                +14 Hari
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(30)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700"
              >
                +30 Hari
              </button>
              <button
                type="button"
                onClick={() => setExpiryDate("")}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[11px] font-mono border border-zinc-700 ml-auto"
              >
                Hapus Batas (Permanen)
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Perubahan Paket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TenantPlanModal(props: TenantPlanModalProps) {
  if (!props.isOpen || !props.tenant) return null;
  return <TenantPlanModalContent key={props.tenant.id} {...props} tenant={props.tenant} />;
}
