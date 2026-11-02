"use client";

import { useState, useMemo, useTransition } from "react";
import {
  AdminTenantItem,
  AdminTelemetrySummary,
  toggleTenantSuspension,
  updateTenantSubscription,
  extendTenantTrial,
  resetTenantAdminAccess,
} from "@/actions/adminTenantActions";
import { startTenantImpersonation } from "@/actions/adminAuditActions";
import { SubscriptionStatus } from "@prisma/client";
import {
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  Ship,
  Users,
  Search,
  Filter,
  ExternalLink,
  Shield,
  KeyRound,
  Sparkles,
  Eye,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
  Plus,
  LogIn,
  Loader2,
} from "lucide-react";
import { TenantDetailModal } from "./TenantDetailModal";
import { TenantSuspendModal } from "./TenantSuspendModal";
import { TenantPlanModal } from "./TenantPlanModal";
import { TenantResetAccessModal } from "./TenantResetAccessModal";

interface TenantManagementViewProps {
  initialTenants: AdminTenantItem[];
  initialSummary: AdminTelemetrySummary;
}

export function TenantManagementView({
  initialTenants,
  initialSummary,
}: TenantManagementViewProps) {
  const [tenants, setTenants] = useState<AdminTenantItem[]>(initialTenants);

  const summary = useMemo<AdminTelemetrySummary>(() => {
    let active = 0;
    let trial = 0;
    let suspended = 0;
    let expired = 0;
    for (const t of tenants) {
      if (!t.isActive || t.subscriptionStatus === "SUSPENDED") {
        suspended++;
      } else if (t.subscriptionStatus === "ACTIVE") {
        active++;
      } else if (t.subscriptionStatus === "TRIAL") {
        trial++;
      } else if (t.subscriptionStatus === "EXPIRED" || t.subscriptionStatus === "CANCELLED") {
        expired++;
      }
    }
    return {
      totalTenants: tenants.length,
      activeTenants: active,
      trialTenants: trial,
      suspendedTenants: suspended,
      expiredTenants: expired,
      totalJobFiles: initialSummary.totalJobFiles,
      totalUsers: initialSummary.totalUsers,
    };
  }, [tenants, initialSummary]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  // Modals state
  const [selectedTenant, setSelectedTenant] = useState<AdminTenantItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Loading & Alert
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [impersonatingTenantId, setImpersonatingTenantId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleStartImpersonate = async (tenantId: string) => {
    setImpersonatingTenantId(tenantId);
    try {
      const res = await startTenantImpersonation(tenantId);
      if (res.success && res.redirectUrl) {
        showToast("success", res.message || "Mengalihkan ke ruang kerja tenant...");
        window.location.href = res.redirectUrl;
      } else {
        showToast("error", res.error || "Gagal memulai sesi impersonasi.");
        setImpersonatingTenantId(null);
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast("error", error.message || "Terjadi kesalahan saat impersonasi.");
      setImpersonatingTenantId(null);
    }
  };

  const handleCopySubdomain = async (subdomain: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`https://${subdomain}.sistemforwarding.com`);
      }
    } catch {
      // Ignore clipboard error
    }
    setCopiedId(subdomain);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered tenants calculation
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      // 1. Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.companyName.toLowerCase().includes(q);
        const matchSub = t.subdomain.toLowerCase().includes(q);
        const matchLegal = t.legalName ? t.legalName.toLowerCase().includes(q) : false;
        const matchAdminEmail = t.primaryAdmin?.email.toLowerCase().includes(q) || false;
        const matchAdminName = t.primaryAdmin?.name.toLowerCase().includes(q) || false;
        if (!matchName && !matchSub && !matchLegal && !matchAdminEmail && !matchAdminName) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "SUSPENDED") {
          if (t.isActive && t.subscriptionStatus !== "SUSPENDED") return false;
        } else if (t.subscriptionStatus !== statusFilter) {
          return false;
        }
      }

      // 3. Tier Filter
      if (tierFilter !== "ALL") {
        if (t.subscriptionTier.toUpperCase() !== tierFilter.toUpperCase()) {
          return false;
        }
      }

      // 4. Active state Filter
      if (activeFilter === "ACTIVE" && !t.isActive) return false;
      if (activeFilter === "INACTIVE" && t.isActive) return false;

      return true;
    });
  }, [tenants, searchQuery, statusFilter, tierFilter, activeFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "ALL" ||
    tierFilter !== "ALL" ||
    activeFilter !== "ALL";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTierFilter("ALL");
    setActiveFilter("ALL");
  };

  // Action handlers
  const handleToggleSuspend = async (
    tenantId: string,
    suspend: boolean,
    reason?: string
  ) => {
    startTransition(async () => {
      const res = await toggleTenantSuspension(tenantId, suspend, reason);
      if (res.success) {
        showToast("success", res.message || "Status tenant berhasil diperbarui.");
        // Optimistic update
        setTenants((prev) =>
          prev.map((t) => {
            if (t.id === tenantId) {
              const nextStatus = suspend
                ? SubscriptionStatus.SUSPENDED
                : t.subscriptionStatus === SubscriptionStatus.SUSPENDED
                ? SubscriptionStatus.ACTIVE
                : t.subscriptionStatus;
              return {
                ...t,
                isActive: !suspend,
                subscriptionStatus: nextStatus,
              };
            }
            return t;
          })
        );
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
        setTenants((prev) =>
          prev.map((t) => {
            if (t.id === tenantId) {
              return {
                ...t,
                ...(data.subscriptionTier ? { subscriptionTier: data.subscriptionTier } : {}),
                ...(data.subscriptionStatus
                  ? {
                      subscriptionStatus: data.subscriptionStatus,
                      isActive: data.subscriptionStatus !== SubscriptionStatus.SUSPENDED,
                    }
                  : {}),
                ...(data.billingCycle ? { billingCycle: data.billingCycle } : {}),
                ...(data.trialEndsAt !== undefined ? { trialEndsAt: data.trialEndsAt } : {}),
              };
            }
            return t;
          })
        );
        setIsPlanOpen(false);
      } else {
        showToast("error", res.error || "Gagal memperbarui paket langganan.");
      }
    });
  };

  const handleExtendTrial = async (tenantId: string, days: number) => {
    startTransition(async () => {
      const res = await extendTenantTrial(tenantId, days);
      if (res.success && res.data) {
        showToast("success", res.message || "Masa aktif berhasil diperpanjang.");
        setTenants((prev) =>
          prev.map((t) => {
            if (t.id === tenantId) {
              return {
                ...t,
                trialEndsAt: res.data?.newTrialEndsAt ?? null,
                isActive: true,
                subscriptionStatus:
                  t.subscriptionStatus === "EXPIRED" ||
                  t.subscriptionStatus === "CANCELLED" ||
                  t.subscriptionStatus === "SUSPENDED"
                    ? SubscriptionStatus.TRIAL
                    : t.subscriptionStatus,
              };
            }
            return t;
          })
        );
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
    <div className="space-y-8 animate-in fade-in duration-300">
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

      {/* 1. Telemetry KPI Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Platform Telemetry & Ruang Kerja Klien
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Live Multi-Tenant Metrics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Total Tenants */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Tenant</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">{summary.totalTenants}</p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">Workspace Terdaftar</p>
          </div>

          {/* Card 2: Active Tenants */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Aktif</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">
              {summary.activeTenants}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">Lisensi Normal</p>
          </div>

          {/* Card 3: Trial Tenants */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Trial</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400">{summary.trialTenants}</p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">Masa Evaluasi</p>
          </div>

          {/* Card 4: Suspended Tenants */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Ditangguhkan</span>
              <Ban className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-rose-400">
              {summary.suspendedTenants}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">Akses Terkunci</p>
          </div>

          {/* Card 5: Job Files */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Job Files</span>
              <Ship className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-400">{summary.totalJobFiles}</p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">Shipment Kargo</p>
          </div>

          {/* Card 6: Platform Users */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pengguna</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-400">{summary.totalUsers}</p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">Total Akun Tim</p>
          </div>
        </div>
      </section>

      {/* 2. Search & Filter Bar */}
      <section className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama perusahaan, subdomain, nama legal, atau email admin..."
              className="block w-full rounded-2xl border border-zinc-700 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white text-xs font-mono"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Quick Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-xl border border-zinc-700 bg-zinc-950/70 pl-3 pr-8 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="TRIAL">TRIAL</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <Filter className="pointer-events-none absolute right-2.5 top-3 w-3.5 h-3.5 text-zinc-400" />
            </div>

            {/* Tier Dropdown */}
            <div className="relative">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="appearance-none rounded-xl border border-zinc-700 bg-zinc-950/70 pl-3 pr-8 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="ALL">Semua Paket</option>
                <option value="STARTER">STARTER</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
              <Sparkles className="pointer-events-none absolute right-2.5 top-3 w-3.5 h-3.5 text-zinc-400" />
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter results info */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80 font-mono">
          <span>
            Menampilkan <strong className="text-white">{filteredTenants.length}</strong> dari{" "}
            <strong className="text-white">{tenants.length}</strong> tenant terdaftar
          </span>

          {hasActiveFilters && (
            <span className="text-amber-400 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Filter aktif diterapkan
            </span>
          )}
        </div>
      </section>

      {/* 3. Tenant Table */}
      <section className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Daftar Ruang Kerja Forwarder
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tata kelola hak operasional, status penangguhan, pemulihan akses, dan inspeksi.
            </p>
          </div>

          <a
            href="https://sistemforwarding.com/onboarding"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Tenant Baru</span>
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-[11px] text-zinc-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Perusahaan / Tenant</th>
                <th className="py-3.5 px-6">Subdomain & Portal</th>
                <th className="py-3.5 px-6">Administrator Utama</th>
                <th className="py-3.5 px-6">Paket & Status</th>
                <th className="py-3.5 px-6">Utilisasi</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {filteredTenants.map((t) => {
                const isSuspended = !t.isActive || t.subscriptionStatus === "SUSPENDED";
                const workspaceUrl = `https://${t.subdomain}.sistemforwarding.com`;

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedTenant(t);
                      setIsDetailOpen(true);
                    }}
                  >
                    {/* Column 1: Perusahaan */}
                    <td className="py-4 px-6 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0 group-hover:border-amber-500/40 transition-colors">
                          {t.companyName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{t.companyName}</span>
                            {isSuspended && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 border border-rose-800 text-rose-300">
                                SUSPENDED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 font-mono truncate">
                            {t.legalName || "No Legal Name"} &bull; NPWP: {t.taxId || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Subdomain */}
                    <td className="py-4 px-6 font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-400 font-semibold">{t.subdomain}</span>
                        <span className="text-zinc-400">.sistemforwarding.com</span>

                        <button
                          onClick={(e) => handleCopySubdomain(t.subdomain, e)}
                          title="Salin URL"
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                          {copiedId === t.subdomain ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        Terdaftar: {new Date(t.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </td>

                    {/* Column 3: Primary Admin */}
                    <td className="py-4 px-6 text-xs" onClick={(e) => e.stopPropagation()}>
                      {t.primaryAdmin ? (
                        <div>
                          <p className="text-zinc-200 font-semibold">{t.primaryAdmin.name}</p>
                          <p className="text-zinc-400 font-mono text-[11px] truncate">
                            {t.primaryAdmin.email}
                          </p>
                          {t.primaryAdmin.phone && (
                            <p className="text-zinc-400 text-[10px] font-mono">
                              Tel: {t.primaryAdmin.phone}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Belum ada admin</span>
                      )}
                    </td>

                    {/* Column 4: Subscription Tier & Status */}
                    <td className="py-4 px-6 text-xs">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-amber-300 font-mono text-[11px] font-bold">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            {t.subscriptionTier}
                          </span>

                          {t.subscriptionStatus === "ACTIVE" && !isSuspended && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}

                          {t.subscriptionStatus === "TRIAL" && !isSuspended && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800 text-amber-400 font-mono text-[10px] font-bold">
                              TRIAL
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-zinc-400 font-mono">
                          {t.trialEndsAt ? (
                            <>
                              Exp:{" "}
                              {new Date(t.trialEndsAt).toLocaleDateString("id-ID", {
                                dateStyle: "short",
                              })}
                            </>
                          ) : (
                            "Tanpa Batas Waktu"
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Column 5: Metrics */}
                    <td className="py-4 px-6 font-mono text-xs">
                      <div className="space-y-0.5 text-zinc-300">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Ship className="w-3 h-3 text-blue-400" />
                          <span>{t.metrics.jobFiles} files</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <Users className="w-3 h-3 text-purple-400" />
                          <span>{t.metrics.totalUsers} users</span>
                        </div>
                      </div>
                    </td>

                    {/* Column 6: Action Buttons */}
                    <td
                      className="py-4 px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Detail Modal Trigger */}
                        <button
                          onClick={() => {
                            setSelectedTenant(t);
                            setIsDetailOpen(true);
                          }}
                          title="Detail Lengkap Tenant"
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Access Trigger */}
                        <button
                          onClick={() => {
                            setSelectedTenant(t);
                            setIsResetOpen(true);
                          }}
                          title="Reset Password Administrator"
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 border border-zinc-700 transition-all"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Suspend / Activate Trigger */}
                        <button
                          onClick={() => {
                            setSelectedTenant(t);
                            setIsSuspendOpen(true);
                          }}
                          title={isSuspended ? "Aktifkan Tenant" : "Suspend Tenant"}
                          className={`p-2 rounded-xl border transition-all ${
                            isSuspended
                              ? "bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border-emerald-800"
                              : "bg-zinc-800 hover:bg-rose-950/50 hover:text-rose-400 text-zinc-400 border-zinc-700 hover:border-rose-900"
                          }`}
                        >
                          {isSuspended ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Impersonate / Login as Tenant */}
                        <button
                          onClick={() => handleStartImpersonate(t.id)}
                          disabled={impersonatingTenantId === t.id}
                          title={`Login sebagai Tenant (${t.companyName})`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all text-xs font-semibold disabled:opacity-50"
                        >
                          {impersonatingTenantId === t.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LogIn className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden xl:inline">Login sbg Tenant</span>
                        </button>

                        {/* Direct link to visit tenant workspace */}
                        <a
                          href={workspaceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka Ruang Kerja Klien"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all border border-zinc-700 hover:border-zinc-600"
                        >
                          <span className="hidden sm:inline">Kunjungi</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700 mx-auto flex items-center justify-center text-zinc-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-white">
                        Tidak ada tenant yang sesuai dengan filter
                      </p>
                      <p className="text-xs text-zinc-400">
                        Coba ubah kata kunci pencarian atau reset filter status langganan.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Semua Filter</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Modals */}
      <TenantDetailModal
        tenant={selectedTenant}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onOpenSuspendModal={(t) => {
          setSelectedTenant(t);
          setIsSuspendOpen(true);
        }}
        onOpenPlanModal={(t) => {
          setSelectedTenant(t);
          setIsPlanOpen(true);
        }}
        onOpenResetModal={(t) => {
          setSelectedTenant(t);
          setIsResetOpen(true);
        }}
        onExtendTrial={handleExtendTrial}
        isExtendingTrial={isPending}
      />

      <TenantSuspendModal
        tenant={selectedTenant}
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onConfirm={handleToggleSuspend}
        isLoading={isPending}
      />

      <TenantPlanModal
        tenant={selectedTenant}
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        onSave={handleUpdatePlan}
        isLoading={isPending}
      />

      <TenantResetAccessModal
        tenant={selectedTenant}
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onReset={handleResetAccess}
        isLoading={isPending}
      />
    </div>
  );
}
