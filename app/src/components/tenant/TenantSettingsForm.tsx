"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Coins,
  Percent,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import {
  updateTenantGeneralSettings,
  TenantGeneralSettingsData,
} from "@/actions/settingsActions";

interface MasterCurrencyOption {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isBaseCurrency: boolean;
}

interface MasterTaxOption {
  id: string;
  taxCode: string;
  taxName: string;
  taxRatePercent: number | string;
  isDefault: boolean;
}

interface TenantSettingsFormProps {
  tenantId: string;
  tenantSubdomain: string;
  initialCompanyName: string;
  initialLegalName?: string | null;
  initialTaxId?: string | null;
  initialBaseCurrency?: string;
  initialDefaultPaymentTermDays?: number;
  initialTaxCalculationMode?: string;
  initialDefaultTaxId?: string;
  currencies: MasterCurrencyOption[];
  taxes: MasterTaxOption[];
}

export function TenantSettingsForm({
  tenantId,
  tenantSubdomain,
  initialCompanyName,
  initialLegalName,
  initialTaxId,
  initialBaseCurrency = "IDR",
  initialDefaultPaymentTermDays = 30,
  initialTaxCalculationMode = "EXCLUSIVE",
  initialDefaultTaxId,
  currencies,
  taxes,
}: TenantSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState<TenantGeneralSettingsData>({
    companyName: initialCompanyName,
    legalName: initialLegalName || "",
    taxId: initialTaxId || "",
    baseCurrency: initialBaseCurrency,
    defaultPaymentTermDays: initialDefaultPaymentTermDays,
    taxCalculationMode: initialTaxCalculationMode,
    defaultTaxId: initialDefaultTaxId || (taxes.find((t) => t.isDefault)?.id || (taxes[0]?.id ?? "")),
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await updateTenantGeneralSettings(tenantId, formData);
        if (res.success) {
          setFeedback({
            type: "success",
            message: res.message || "Konfigurasi tenant berhasil disimpan ke PostgreSQL.",
          });
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Gagal memperbarui konfigurasi.",
          });
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Terjadi kesalahan internal.",
        });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 shadow-xs space-y-6 transition-colors"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Formulir Konfigurasi &amp; Profil Tenant
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Ubah identitas hukum perusahaan, mata uang operasional, dan parameter pajak bawaan.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 disabled:opacity-50 transition-all"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Simpan Konfigurasi</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Field Set 1: Profil Perusahaan */}
      <div className="space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          1. Profil &amp; Legalitas Perusahaan Forwarder
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Brand / Tampilan Konsol <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Badan Hukum Resmi (PT / CV)
            </label>
            <input
              type="text"
              value={formData.legalName || ""}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              placeholder="Contoh: PT. Sumber Makmur Forwarding Indonesia"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              NPWP Perusahaan (Tax ID)
            </label>
            <input
              type="text"
              value={formData.taxId || ""}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              placeholder="01.234.567.8-012.000"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Subdomain Terdaftar
            </label>
            <input
              type="text"
              disabled
              value={`${tenantSubdomain}.sistemforwarding.com`}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 font-mono cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Field Set 2: Kebijakan Keuangan, Mata Uang & PPN */}
      <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-white/[0.08]">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          2. Pengaturan Keuangan &amp; Pajak Bawaan
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Base Currency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mata Uang Fungsional (Base Currency)
            </label>
            <select
              value={formData.baseCurrency}
              onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {currencies.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code} - {c.name} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Default TOP */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Term of Payment Bawaan (TOP)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={365}
                value={formData.defaultPaymentTermDays}
                onChange={(e) =>
                  setFormData({ ...formData, defaultPaymentTermDays: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                Hari
              </span>
            </div>
          </div>

          {/* Default Tax Policy */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tarif Pajak Bawaan (Default Tax)
            </label>
            <select
              value={formData.defaultTaxId}
              onChange={(e) => setFormData({ ...formData, defaultTaxId: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {taxes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.taxName} ({t.taxRatePercent}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 disabled:opacity-50 transition-all"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Simpan Konfigurasi &amp; Kebijakan Pajak</span>
        </button>
      </div>
    </form>
  );
}
