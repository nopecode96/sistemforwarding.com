"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  AdminTenantItem,
  toggleTenantSuspension,
  updateTenantSubscription,
  extendTenantTrial,
  resetTenantAdminAccess,
} from "@/actions/adminTenantActions";
import { startTenantImpersonation } from "@/actions/adminAuditActions";
import { SubscriptionStatus } from "@prisma/client";
import {
  ArrowLeft,
  ExternalLink,
  Shield,
  KeyRound,
  Sparkles,
  Ban,
  CheckCircle2,
  Users,
  Copy,
  Check,
  AlertCircle,
  LogIn,
  Loader2,
} from "lucide-react";
import { TenantSuspendModal } from "./TenantSuspendModal";
import { TenantPlanModal } from "./TenantPlanModal";
import { TenantResetAccessModal } from "./TenantResetAccessModal";

interface TenantDetailViewProps {
  initialTenant: AdminTenantItem;
}

export function TenantDetailView({ initialTenant }: TenantDetailViewProps) {
  const pathname = usePathname();
  const isDirectAdminPath = pathname.startsWith("/admin");
  const backHref = isDirectAdminPath ? "/admin/tenants" : "/tenants";

  const [tenant, setTenant] = useState<AdminTenantItem>(initialTenant);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleStartImpersonate = async () => {
    setIsImpersonating(true);
    try {
      const res = await startTenantImpersonation(tenant.id);
      if (res.success && res.redirectUrl) {
        showToast("success", res.message || "Mengalihkan ke ruang kerja tenant...");
        window.location.href = res.redirectUrl;
      } else {
        showToast("error", res.error || "Gagal memulai sesi impersonasi.");
        setIsImpersonating(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast("error", error.message || "Terjadi kesalahan sistem saat impersonasi.");
      setIsImpersonating(false);
    }
  };

  const workspaceUrl = `https://${tenant.subdomain}.sistemforwarding.com`;

  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(workspaceUrl);
      }
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isSuspended = !tenant.isActive || tenant.subscriptionStatus === "SUSPENDED";

  // Action Handlers
  const handleToggleSuspend = async (
    tenantId: string,
    suspend: boolean,
    reason?: string
  ) => {
    startTransition(async () => {
      const res = await toggleTenantSuspension(tenantId, suspend, reason);
      if (res.success) {
        showToast("success", res.message || "Status tenant berhasil diperbarui.");
        const nextStatus = suspend
          ? SubscriptionStatus.SUSPENDED
          : tenant.subscriptionStatus === SubscriptionStatus.SUSPENDED
          ? SubscriptionStatus.ACTIVE
          : tenant.subscriptionStatus;
        setTenant((prev) => ({
          ...prev,
          isActive: !suspend,
          subscriptionStatus: nextStatus,
        }));
        setIsSuspendOpen(false);
      } else {
        showToast("error", res.error || "Gagal mengubah status penangguhan.");
      }
    });
  };

  const handleUpdatePlan = async (
    tenantId: string,
    data: {
      subscriptionTier?: string;
      subscriptionStatus?: SubscriptionStatus;
      billingCycle?: string;
      trialEndsAt?: string | null;
    }
  ) => {
    startTransition(async () => {
      const res = await updateTenantSubscription(tenantId, data);
      if (res.success) {
        showToast("success", res.message || "Paket langganan berhasil diperbarui.");
        setTenant((prev) => ({
          ...prev,
          ...(data.subscriptionTier ? { subscriptionTier: data.subscriptionTier } : {}),
          ...(data.subscriptionStatus
            ? {
                subscriptionStatus: data.subscriptionStatus,
                isActive:
                  data.subscriptionStatus !== SubscriptionStatus.SUSPENDED &&
                  data.subscriptionStatus !== SubscriptionStatus.CANCELLED,
              }
            : {}),
          ...(data.billingCycle ? { billingCycle: data.billingCycle } : {}),
          ...(data.trialEndsAt !== undefined ? { trialEndsAt: data.trialEndsAt } : {}),
        }));
        setIsPlanOpen(false);
      } else {
        showToast("error", res.error || "Gagal memperbarui paket langganan.");
      }
    });
  };

  const handleExtendTrial = async (days: number) => {
    startTransition(async () => {
      const res = await extendTenantTrial(tenant.id, days);
      if (res.success && res.data) {
        showToast("success", res.message || "Masa aktif berhasil diperpanjang.");
        setTenant((prev) => ({
          ...prev,
          trialEndsAt: res.data?.newTrialEndsAt ?? null,
          isActive: true,
          subscriptionStatus:
            prev.subscriptionStatus === "EXPIRED" ||
            prev.subscriptionStatus === "CANCELLED" ||
            prev.subscriptionStatus === "SUSPENDED"
              ? SubscriptionStatus.TRIAL
              : prev.subscriptionStatus,
        }));
      } else {
        showToast("error", res.error || "Gagal memperpanjang masa aktif.");
      }
    });
  };

  const handleResetAccess = async (
    tenantId: string,
    targetUserId?: string,
    customPassword?: string
  ) => {
    const res = await resetTenantAdminAccess(tenantId, targetUserId, customPassword);
    if (!res.success || !res.data) {
      throw new Error(res.error || "Gagal mereset akses pengguna.");
    }
    showToast("success", "Kredensial akses administrator berhasil dibuat.");
    return res.data;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-semibold max-w-md animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-800 text-emerald-300"
              : "bg-rose-950/90 border-rose-800 text-rose-300"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="leading-relaxed">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Manajemen Tenant</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all border border-zinc-700"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Salin URL Portal</span>
              </>
            )}
          </button>

          <button
            onClick={handleStartImpersonate}
            disabled={isImpersonating}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20 disabled:opacity-60"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all border border-zinc-700"
          >
            <span>Buka Ruang Kerja</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>
      </div>

      {/* Main Tenant Details Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
        {/* Header Profile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-black text-amber-400 shadow-inner shrink-0">
              {tenant.companyName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-black text-white">{tenant.companyName}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    isSuspended
                      ? "bg-rose-950/60 border border-rose-800 text-rose-300"
                      : tenant.subscriptionStatus === "ACTIVE"
                      ? "bg-emerald-950/60 border border-emerald-800 text-emerald-400"
                      : "bg-amber-950/60 border border-amber-800 text-amber-400"
                  }`}
                >
                  {tenant.subscriptionStatus}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                {workspaceUrl} &bull; ID: {tenant.id}
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleStartImpersonate}
              disabled={isImpersonating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all disabled:opacity-60"
            >
              {isImpersonating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>Login sbg Tenant</span>
            </button>
            <button
              onClick={() => setIsResetOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Akses Admin</span>
            </button>

            <button
              onClick={() => setIsPlanOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ubah Paket</span>
            </button>

            <button
              onClick={() => setIsSuspendOpen(true)}
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

        {/* 3 Overview Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Administrator Utama</span>
            <p className="text-sm font-bold text-white mt-1">
              {tenant.primaryAdmin?.name || "Belum ada"}
            </p>
            <p className="text-xs text-zinc-400 font-mono">{tenant.primaryAdmin?.email || "-"}</p>
            {tenant.primaryAdmin?.phone && (
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Tel: {tenant.primaryAdmin.phone}
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[11px] font-mono text-zinc-400 uppercase">Paket & Billing</span>
            <p className="text-sm font-bold text-amber-400 mt-1">{tenant.subscriptionTier}</p>
            <p className="text-xs text-zinc-400 font-mono">Siklus: {tenant.billingCycle}</p>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
              NPWP: {tenant.taxId || "Belum tercatat"}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
            <div>
              <span className="text-[11px] font-mono text-zinc-400 uppercase">Masa Berlaku</span>
              <p className="text-sm font-bold text-white mt-0.5">
                {tenant.trialEndsAt
                  ? new Date(tenant.trialEndsAt).toLocaleDateString("id-ID", { dateStyle: "medium" })
                  : "Tanpa Batas Waktu"}
              </p>
            </div>

            {/* Quick Trial Extension Pills */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-zinc-400 font-mono">Perpanjang:</span>
              <button
                onClick={() => handleExtendTrial(7)}
                disabled={isPending}
                className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono border border-zinc-700 disabled:opacity-50"
              >
                +7h
              </button>
              <button
                onClick={() => handleExtendTrial(14)}
                disabled={isPending}
                className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono border border-zinc-700 disabled:opacity-50"
              >
                +14h
              </button>
              <button
                onClick={() => handleExtendTrial(30)}
                disabled={isPending}
                className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono border border-amber-500/40 disabled:opacity-50"
              >
                +30h
              </button>
            </div>
          </div>
        </div>

        {/* Operational Database Telemetry */}
        <div className="pt-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Utilisasi Operasional Tenant</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 uppercase block mb-1">
                Job Files
              </span>
              <p className="text-xl font-black text-white">{tenant.metrics.jobFiles}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 uppercase block mb-1">
                Invoices
              </span>
              <p className="text-xl font-black text-white">{tenant.metrics.invoices}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 uppercase block mb-1">
                Vendors
              </span>
              <p className="text-xl font-black text-white">{tenant.metrics.vendors}</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 uppercase block mb-1">
                Customers
              </span>
              <p className="text-xl font-black text-white">{tenant.metrics.customers}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Daftar Pengguna ({tenant.users.length})</span>
            </h3>
            <button
              onClick={() => setIsResetOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
            >
              Reset Akses Pengguna
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Nama</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {tenant.users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{u.email}</td>
                    <td className="py-3 px-4 font-mono">{u.role}</td>
                    <td className="py-3 px-4 text-right">
                      {u.isActive ? (
                        <span className="text-emerald-400 font-semibold">Aktif</span>
                      ) : (
                        <span className="text-rose-400 font-semibold">Nonaktif</span>
                      )}
                    </td>
                  </tr>
                ))}
                {tenant.users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-400">
                      Belum ada pengguna terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      <TenantSuspendModal
        tenant={tenant}
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onConfirm={handleToggleSuspend}
        isLoading={isPending}
      />

      <TenantPlanModal
        tenant={tenant}
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        onSave={handleUpdatePlan}
        isLoading={isPending}
      />

      <TenantResetAccessModal
        tenant={tenant}
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onReset={handleResetAccess}
        isLoading={isPending}
      />
    </div>
  );
}
