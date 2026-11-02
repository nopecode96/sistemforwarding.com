"use client";

import { useState, useTransition } from "react";
import {
  AdminPlatformPlan,
  AdminPlatformInvoice,
  generatePlatformInvoice,
  ActionResult,
} from "@/actions/adminBillingActions";
import { X, Receipt, QrCode, AlertCircle } from "lucide-react";

interface TenantOption {
  id: string;
  subdomain: string;
  companyName: string;
  subscriptionStatus: string;
  subscriptionTier: string;
  trialEndsAt: string | null;
}

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: TenantOption[];
  plans: AdminPlatformPlan[];
  onCreated: (createdInvoice: AdminPlatformInvoice) => void;
}

export function GenerateInvoiceModal({
  isOpen,
  onClose,
  tenants,
  plans,
  onCreated,
}: GenerateInvoiceModalProps) {
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id || "");
  const [selectedPlanCode, setSelectedPlanCode] = useState(
    plans.find((p) => p.code === "MONTHLY")?.code || plans[0]?.code || "MONTHLY"
  );
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [billingPeriod, setBillingPeriod] = useState("");
  const [notes, setNotes] = useState("");
  const [withQris, setWithQris] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const currentPlan = plans.find((p) => p.code === selectedPlanCode);
  const effectivePrice =
    typeof customAmount === "number" && customAmount >= 0
      ? customAmount
      : currentPlan
      ? currentPlan.price
      : 1000000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedTenantId) {
      setErrorMsg("Pilih tenant yang akan ditagihkan.");
      return;
    }

    startTransition(async () => {
      const res: ActionResult<AdminPlatformInvoice> = await generatePlatformInvoice({
        tenantId: selectedTenantId,
        planIdOrCode: selectedPlanCode,
        customAmount: typeof customAmount === "number" ? customAmount : undefined,
        billingPeriod: billingPeriod.trim() || undefined,
        notes: notes.trim() || undefined,
        withBorderPayQris: withQris,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menerbitkan invoice.");
      } else if (res.data) {
        onCreated(res.data);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Terbitkan Invoice SaaS Baru</h3>
              <p className="text-xs text-zinc-400">
                Buat tagihan langganan untuk tenant dengan integrasi QRIS BorderPay otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tenant Selector */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Pilih Tenant Penerima Tagihan <span className="text-amber-400">*</span>
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-medium focus:border-amber-500 focus:outline-none"
              required
            >
              <option value="" disabled>
                -- Pilih Perusahaan Tenant --
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.companyName} ({t.subdomain}.sistemforwarding.com) — Tier: {t.subscriptionTier} [{t.subscriptionStatus}]
                </option>
              ))}
            </select>
          </div>

          {/* Plan Selector */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Pilihan Paket Langganan <span className="text-amber-400">*</span>
            </label>
            <select
              value={selectedPlanCode}
              onChange={(e) => {
                setSelectedPlanCode(e.target.value);
                setCustomAmount("");
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-medium focus:border-amber-500 focus:outline-none"
              required
            >
              {plans.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name} ({p.code}) — Rp {p.price.toLocaleString("id-ID")} ({p.billingCycle})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Amount */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Nominal Tagihan (IDR)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={customAmount}
                onChange={(e) =>
                  setCustomAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder={`Default: Rp ${currentPlan?.price.toLocaleString("id-ID") || 0}`}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Kosongkan untuk memakai harga standar paket.</p>
            </div>

            {/* Billing Period Label */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Keterangan Periode (Opsional)
              </label>
              <input
                type="text"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                placeholder="Contoh: 1 Bulan (Nov 2026)"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan invoice atau instruksi pembayaran..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* BorderPay QRIS Toggle */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Generate QRIS BorderPay Otomatis</p>
                <p className="text-[10px] text-zinc-400">
                  Buat payload QRIS dinamis berstandar ASPI / BorderPay gateway
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={withQris}
              onChange={(e) => setWithQris(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500"
            />
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Total Tagihan Final:</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                Rp {effectivePrice.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-zinc-500">Termin Pembayaran:</span>
              <span className="text-zinc-300 font-mono">7 Hari Kalender</span>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {isPending ? "Menerbitkan..." : "Terbitkan Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
