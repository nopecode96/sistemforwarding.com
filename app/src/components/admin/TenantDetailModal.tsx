"use client";

import { useState } from "react";
import { AdminTenantItem } from "@/actions/adminTenantActions";
import { startTenantImpersonation } from "@/actions/adminAuditActions";
import {
  X,
  Building2,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle2,
  Ban,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  CreditCard,
  LogIn,
  Loader2,
} from "lucide-react";

interface TenantDetailModalProps {
  tenant: AdminTenantItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSuspendModal: (tenant: AdminTenantItem) => void;
  onOpenPlanModal: (tenant: AdminTenantItem) => void;
  onOpenResetModal: (tenant: AdminTenantItem) => void;
  onExtendTrial: (tenantId: string, days: number) => Promise<void>;
  isExtendingTrial?: boolean;
}

export function TenantDetailModal({
  tenant,
  isOpen,
  onClose,
  onOpenSuspendModal,
  onOpenPlanModal,
  onOpenResetModal,
  onExtendTrial,
  isExtendingTrial = false,
}: TenantDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "telemetry">("overview");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  if (!isOpen || !tenant) return null;

  const workspaceUrl = `https://${tenant.subdomain}.sistemforwarding.com`;

  const handleStartImpersonate = async () => {
    setIsImpersonating(true);
    setImpersonateError(null);
    try {
      const res = await startTenantImpersonation(tenant.id);
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        setImpersonateError(res.error || "Gagal memulai impersonasi.");
        setIsImpersonating(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setImpersonateError(error.message || "Terjadi kesalahan sistem.");
      setIsImpersonating(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(workspaceUrl);
      }
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Ignore copy error in non-secure context
    }
  };

  const isSuspended = !tenant.isActive || tenant.subscriptionStatus === "SUSPENDED";

  const getStatusBadge = () => {
    if (isSuspended) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-bold font-mono">
          <Ban className="w-3.5 h-3.5 text-rose-400" />
          SUSPENDED
        </span>
      );
    }
    if (tenant.subscriptionStatus === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-bold font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ACTIVE
        </span>
      );
    }
    if (tenant.subscriptionStatus === "TRIAL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-400 text-xs font-bold font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          TRIAL EVALUATION
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold font-mono">
        {tenant.subscriptionStatus}
      </span>
    );
  };

  const trialDaysRemaining = tenant.trialDaysRemaining;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-zinc-800 bg-gradient-to-b from-zinc-800/50 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-black text-amber-400 shadow-inner shrink-0">
                {tenant.companyName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {tenant.companyName}
                  </h2>
                  {getStatusBadge()}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-mono text-zinc-400">
                    ID: <span className="text-zinc-500">{tenant.id}</span>
                  </p>
                  <span className="text-zinc-600">&bull;</span>
                  <p className="text-xs text-zinc-400">
                    Dibuat {new Date(tenant.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Subdomain Banner */}
          <div className="mt-5 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-zinc-400">Portal Ruang Kerja:</span>
              <a
                href={workspaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 flex items-center gap-1"
              >
                {workspaceUrl}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Salin URL</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStartImpersonate}
                disabled={isImpersonating}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20 disabled:opacity-60"
              >
                {isImpersonating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>Login sebagai Tenant</span>
              </button>

              <a
                href={workspaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all border border-zinc-700"
              >
                <span>Buka Ruang Kerja</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
            {impersonateError && (
              <p className="text-[11px] font-bold text-rose-400 mt-2 text-right">
                {impersonateError}
              </p>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-6 border-b border-zinc-800 -mb-6 pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === "overview"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Ringkasan & Langganan
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "users"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <span>Pengguna & Hak Akses</span>
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono">
                {tenant.users.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("telemetry")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === "telemetry"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              Metrik Basis Data
            </button>
          </div>
        </div>

        {/* Tab 1: Ringkasan & Langganan */}
        {activeTab === "overview" && (
          <div className="p-6 sm:p-7 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Legal & Company Info */}
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Informasi Legalitas Tenant
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block mb-0.5">Nama Perusahaan:</span>
                    <span className="text-white font-semibold">{tenant.companyName}</span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block mb-0.5">Nama Legal / Badan Hukum:</span>
                    <span className="text-zinc-200 font-mono">
                      {tenant.legalName || "Belum diisi oleh tenant"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block mb-0.5">Nomor NPWP / Tax ID:</span>
                    <span className="text-zinc-200 font-mono">
                      {tenant.taxId || "Belum tercatat"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block mb-0.5">Subdomain Terdaftar:</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {tenant.subdomain}.sistemforwarding.com
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Subscription Plan & Expiry */}
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Paket Langganan & Masa Aktif
                  </h3>
                  <button
                    onClick={() => onOpenPlanModal(tenant)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2"
                  >
                    Ubah Paket
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Tier Langganan:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-amber-300 font-mono font-bold">
                      {tenant.subscriptionTier}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Siklus Penagihan:</span>
                    <span className="text-zinc-200 font-mono font-semibold">
                      {tenant.billingCycle}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Batas Waktu / Trial:</span>
                    <span className="text-zinc-200 font-mono">
                      {tenant.trialEndsAt
                        ? new Date(tenant.trialEndsAt).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })
                        : "Tidak terbatas"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Sisa Masa Aktif:</span>
                    {trialDaysRemaining !== null ? (
                      trialDaysRemaining > 0 ? (
                        <span className="text-emerald-400 font-mono font-semibold">
                          {trialDaysRemaining} Hari Tersisa
                        </span>
                      ) : (
                        <span className="text-rose-400 font-mono font-semibold">
                          Kedaluwarsa ({Math.abs(trialDaysRemaining)} hari lalu)
                        </span>
                      )
                    ) : (
                      <span className="text-zinc-400 font-mono">Aktif Permanen</span>
                    )}
                  </div>

                  {/* Quick Extend Buttons */}
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-2 font-mono">
                      Perpanjang Trial Cepat:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => onExtendTrial(tenant.id, 7)}
                        disabled={isExtendingTrial}
                        className="py-1.5 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all text-center disabled:opacity-50"
                      >
                        +7 Hari
                      </button>
                      <button
                        onClick={() => onExtendTrial(tenant.id, 14)}
                        disabled={isExtendingTrial}
                        className="py-1.5 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all text-center disabled:opacity-50"
                      >
                        +14 Hari
                      </button>
                      <button
                        onClick={() => onExtendTrial(tenant.id, 30)}
                        disabled={isExtendingTrial}
                        className="py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-all text-center disabled:opacity-50"
                      >
                        +30 Hari
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Tindakan Tata Kelola:</span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => onOpenResetModal(tenant)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Akses Admin</span>
                </button>

                <button
                  onClick={() => onOpenPlanModal(tenant)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ubah Status / Paket</span>
                </button>

                <button
                  onClick={() => onOpenSuspendModal(tenant)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSuspended
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80"
                  }`}
                >
                  {isSuspended ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aktifkan Tenant</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Suspend Tenant</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pengguna & Hak Akses */}
        {activeTab === "users" && (
          <div className="p-6 sm:p-7 space-y-5">
            {/* Primary Administrator Callout */}
            {tenant.primaryAdmin && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {tenant.primaryAdmin.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {tenant.primaryAdmin.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800 text-[10px] font-mono text-amber-300 font-bold">
                        PRIMARY ADMIN
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      {tenant.primaryAdmin.email} &bull; Tel: {tenant.primaryAdmin.phone || "-"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenResetModal(tenant)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Reset Password Akun Ini</span>
                </button>
              </div>
            )}

            {/* All Users Table */}
            <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Pengguna</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role / Hak Akses</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Terdaftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                  {tenant.users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px] font-bold">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                  {tenant.users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        Belum ada data pengguna pada ruang kerja ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Metrik Basis Data */}
        {activeTab === "telemetry" && (
          <div className="p-6 sm:p-7 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Job Files Kargo
                </span>
                <p className="text-2xl font-black text-white">{tenant.metrics.jobFiles}</p>
                <p className="text-[10px] text-zinc-400 mt-1">Shipment aktif & arsip</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Invoices & Tagihan
                </span>
                <p className="text-2xl font-black text-white">{tenant.metrics.invoices}</p>
                <p className="text-[10px] text-zinc-400 mt-1">Faktur & AR billing</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Master Vendor
                </span>
                <p className="text-2xl font-black text-white">{tenant.metrics.vendors}</p>
                <p className="text-[10px] text-zinc-400 mt-1">Pelayaran, maskapai, trucking</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Klien / Customer
                </span>
                <p className="text-2xl font-black text-white">{tenant.metrics.customers}</p>
                <p className="text-[10px] text-zinc-400 mt-1">Shipper & consignee terdata</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2 text-xs">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Spesifikasi Isolasi Data PostgreSQL:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400 font-mono text-[11px]">
                <div>
                  Relational Partitioning:{" "}
                  <span className="text-emerald-400 font-bold">tenantId Scoped</span>
                </div>
                <div>
                  Prefix Generator: <span className="text-zinc-200">Dynamic Counter Reset</span>
                </div>
                <div>
                  Financial Lock Date: <span className="text-zinc-200">Period Guard Active</span>
                </div>
                <div>
                  Audit Log Stream: <span className="text-zinc-200">Platform Enabled</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-mono">
            Sistem Forwarding Multi-Tenant Isolation Core
          </p>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all border border-zinc-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
