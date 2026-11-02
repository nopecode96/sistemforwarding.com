"use client";

import { useState, useTransition } from "react";
import {
  GetAuditLogsResponse,
  AuditLogItem,
  getAuditLogs,
} from "@/actions/adminAuditActions";
import {
  Shield,
  Search,
  Filter,
  RotateCcw,
  RefreshCw,
  Eye,
  X,
  Copy,
  Check,
  UserCheck,
  Lock,
  Receipt,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Globe,
  Terminal,
  Clock,
  Layers,
} from "lucide-react";

interface AuditLogViewProps {
  initialData: GetAuditLogsResponse;
}

export function AuditLogView({ initialData }: AuditLogViewProps) {
  const [data, setData] = useState<GetAuditLogsResponse>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionCategory, setActionCategory] = useState("ALL");
  const [targetType, setTargetType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Selected Log for JSON payload inspection modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const fetchLogs = (
    newPage = page,
    newQuery = searchQuery,
    newCategory = actionCategory,
    newTarget = targetType
  ) => {
    startTransition(async () => {
      const res = await getAuditLogs({
        query: newQuery,
        action: newCategory,
        targetType: newTarget,
        page: newPage,
        pageSize: 20,
      });
      setData(res);
      setPage(newPage);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1, searchQuery, actionCategory, targetType);
  };

  const handleCategoryChange = (cat: string) => {
    setActionCategory(cat);
    fetchLogs(1, searchQuery, cat, targetType);
  };

  const handleTargetChange = (target: string) => {
    setTargetType(target);
    fetchLogs(1, searchQuery, actionCategory, target);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActionCategory("ALL");
    setTargetType("ALL");
    fetchLogs(1, "", "ALL", "ALL");
  };

  const handleCopyJson = async () => {
    if (!selectedLog) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(
          JSON.stringify(selectedLog.details, null, 2)
        );
      }
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // Ignore copy error
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "IMPERSONATE_START":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-950/80 border border-amber-700 text-amber-300">
            <UserCheck className="w-3 h-3 text-amber-400" />
            IMPERSONATE_START
          </span>
        );
      case "IMPERSONATE_STOP":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-950/60 border border-amber-800 text-amber-400">
            <UserCheck className="w-3 h-3 text-amber-500" />
            IMPERSONATE_STOP
          </span>
        );
      case "TENANT_SUSPEND":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-950/80 border border-rose-700 text-rose-300">
            <Lock className="w-3 h-3 text-rose-400" />
            TENANT_SUSPEND
          </span>
        );
      case "TENANT_PASSWORD_RESET":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-950/70 border border-rose-800 text-rose-300">
            <Lock className="w-3 h-3 text-rose-400" />
            PASSWORD_RESET
          </span>
        );
      case "INVOICE_CANCEL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-950/60 border border-rose-800 text-rose-300">
            INVOICE_CANCEL
          </span>
        );
      case "TENANT_ACTIVATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
            TENANT_ACTIVATE
          </span>
        );
      case "INVOICE_PAID_MANUAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300">
            <Receipt className="w-3 h-3 text-emerald-400" />
            INVOICE_PAID
          </span>
        );
      case "BORDERPAY_RECONCILE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950/60 border border-emerald-800 text-emerald-400">
            BORDERPAY_RECONCILE
          </span>
        );
      case "PLAN_UPSERT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-950/80 border border-blue-700 text-blue-300">
            <Sparkles className="w-3 h-3 text-blue-400" />
            PLAN_UPSERT
          </span>
        );
      case "PLAN_TOGGLE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-950/70 border border-blue-800 text-blue-300">
            PLAN_TOGGLE
          </span>
        );
      case "TENANT_PLAN_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-950/80 border border-blue-700 text-blue-300">
            PLAN_UPDATE
          </span>
        );
      case "PLAN_DELETE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-950/70 border border-rose-800 text-rose-300">
            PLAN_DELETE
          </span>
        );
      case "TENANT_PROFILE_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-950/70 border border-blue-800 text-blue-300">
            PROFILE_UPDATE
          </span>
        );
      case "TENANT_TRIAL_EXTEND":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-950/60 border border-blue-800 text-blue-400">
            TRIAL_EXTEND
          </span>
        );
      case "ADMIN_LOGIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-950/80 border border-indigo-700 text-indigo-300">
            ADMIN_LOGIN
          </span>
        );
      case "ADMIN_LOGOUT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-zinc-300">
            ADMIN_LOGOUT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-zinc-300">
            {action}
          </span>
        );
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || actionCategory !== "ALL" || targetType !== "ALL";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Telemetry KPI Cards */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Audit Trail &amp; Keamanan Platform
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Pencatatan real-time seluruh aktivitas tata kelola super administrator, sesi impersonasi, dan mutasi data sensitif.
            </p>
          </div>

          <button
            onClick={() => fetchLogs()}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span>Perbarui Telemetri</span>
          </button>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Logs */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Total Peristiwa
              </span>
              <Terminal className="w-4 h-4 text-zinc-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {data.summary.totalLogs}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">
              Entri Audit Tersimpan
            </p>
          </div>

          {/* Card 2: Impersonations */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Sesi Impersonasi
              </span>
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-400">
              {data.summary.impersonationCount}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">
              Login sebagai Tenant
            </p>
          </div>

          {/* Card 3: Security & Governance */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Aksi Keamanan
              </span>
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-rose-400">
              {data.summary.securityCount}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">
              Suspend / Reset Kredensial
            </p>
          </div>

          {/* Card 4: Billing & Subscriptions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Billing &amp; Paket
              </span>
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">
              {data.summary.billingCount}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">
              Pembayaran &amp; Konfigurasi
            </p>
          </div>
        </div>
      </section>

      {/* 2. Search & Filter Bar */}
      <section className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama operator, email, nama target, action, atau ID..."
              className="block w-full rounded-2xl border border-zinc-700 bg-zinc-950/70 pl-10 pr-16 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            <button
              type="submit"
              className="absolute inset-y-1.5 right-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition-all"
            >
              Cari
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={actionCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="appearance-none rounded-xl border border-zinc-700 bg-zinc-950/70 pl-3 pr-8 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="ALL">Semua Kategori Aksi</option>
                <option value="IMPERSONATION">Impersonasi Saja</option>
                <option value="SECURITY">Keamanan &amp; Tata Kelola</option>
                <option value="BILLING">Billing &amp; Paket Langganan</option>
                <option value="ADMIN_LOGIN">Admin Login</option>
                <option value="ADMIN_LOGOUT">Admin Logout</option>
                <option value="TENANT_SUSPEND">Tenant Suspend</option>
                <option value="TENANT_ACTIVATE">Tenant Activate</option>
                <option value="INVOICE_PAID_MANUAL">Invoice Paid</option>
                <option value="PLAN_UPSERT">Plan Upsert</option>
              </select>
              <Filter className="pointer-events-none absolute right-2.5 top-3 w-3.5 h-3.5 text-zinc-400" />
            </div>

            {/* Target Type Filter */}
            <div className="relative">
              <select
                value={targetType}
                onChange={(e) => handleTargetChange(e.target.value)}
                className="appearance-none rounded-xl border border-zinc-700 bg-zinc-950/70 pl-3 pr-8 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="ALL">Semua Target</option>
                <option value="TENANT">TENANT</option>
                <option value="INVOICE">INVOICE</option>
                <option value="PLAN">PLAN</option>
                <option value="AUTH">AUTH</option>
              </select>
              <Layers className="pointer-events-none absolute right-2.5 top-3 w-3.5 h-3.5 text-zinc-400" />
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>
      </section>

      {/* 3. Interactive Audit Logs Table */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-4 px-6">Waktu (UTC/WIB)</th>
                <th className="py-4 px-6">Operator Admin</th>
                <th className="py-4 px-6">Tipe Aksi</th>
                <th className="py-4 px-6">Target Entitas</th>
                <th className="py-4 px-6">IP &amp; User Agent</th>
                <th className="py-4 px-6 text-right">Detail Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {data.logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  {/* Column 1: Timestamp */}
                  <td className="py-4 px-6 font-mono text-zinc-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{new Date(log.createdAt).toLocaleString("id-ID")}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ID: {log.id.slice(0, 10)}...
                    </span>
                  </td>

                  {/* Column 2: Operator */}
                  <td className="py-4 px-6">
                    <div className="font-semibold text-white">
                      {log.operatorName}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {log.operatorEmail}
                    </div>
                  </td>

                  {/* Column 3: Action Badge */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>

                  {/* Column 4: Target */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5">
                      {log.targetType && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {log.targetType}
                        </span>
                      )}
                      <span className="font-bold text-white truncate max-w-[180px]">
                        {log.targetName || log.targetId || "-"}
                      </span>
                    </div>
                    {log.targetId && log.targetName && (
                      <p className="text-[10px] text-zinc-400 font-mono truncate max-w-[200px]">
                        ID: {log.targetId}
                      </p>
                    )}
                  </td>

                  {/* Column 5: IP & Client */}
                  <td className="py-4 px-6 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{log.ipAddress || "127.0.0.1 (Local)"}</span>
                    </div>
                    {log.userAgent && (
                      <p className="text-[10px] text-zinc-400 truncate max-w-[160px]" title={log.userAgent}>
                        {log.userAgent}
                      </p>
                    )}
                  </td>

                  {/* Column 6: Inspect Action */}
                  <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedLog(log)}
                      title="Inspeksi Payload JSON"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 hover:border-zinc-600 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Inspeksi</span>
                    </button>
                  </td>
                </tr>
              ))}

              {data.logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Shield className="w-8 h-8 text-zinc-400 mx-auto" />
                      <p className="text-sm font-semibold text-white">
                        Tidak ada entri log audit yang ditemukan
                      </p>
                      <p className="text-xs text-zinc-400">
                        Coba sesuaikan kata kunci pencarian atau ubah filter kategori aksi.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Semua Filter</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div>
            Menampilkan <span className="font-bold text-white">{data.logs.length}</span> dari{" "}
            <span className="font-bold text-white">{data.total}</span> entri audit &bull; Halaman{" "}
            <span className="font-bold text-white">{data.page}</span> dari{" "}
            <span className="font-bold text-white">{data.totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= data.totalPages || isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. JSON Payload Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Inspeksi Log Audit #{selectedLog.id}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {new Date(selectedLog.createdAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">
                    Operator Admin
                  </span>
                  <p className="font-bold text-white mt-0.5">
                    {selectedLog.operatorName}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400">
                    {selectedLog.operatorEmail}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">
                    Tipe Aksi &amp; Target
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    {getActionBadge(selectedLog.action)}
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono mt-1 truncate">
                    {selectedLog.targetType || "GENERAL"}: {selectedLog.targetName || selectedLog.targetId || "-"}
                  </p>
                </div>
              </div>

              {/* Network / Client Info */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">
                    Alamat IP &amp; User Agent
                  </span>
                  <span className="font-mono text-zinc-300">
                    {selectedLog.ipAddress || "127.0.0.1"}
                  </span>
                </div>
                {selectedLog.userAgent && (
                  <p className="text-[11px] font-mono text-zinc-400 mt-1 break-all">
                    {selectedLog.userAgent}
                  </p>
                )}
              </div>

              {/* JSON Payload Viewer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">
                    Struktur Data Payload (JSON):
                  </span>
                  <button
                    onClick={handleCopyJson}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-all border border-zinc-700"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Salin JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-amber-300/90 overflow-x-auto max-h-64 leading-relaxed">
                  {selectedLog.details
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : "// Tidak ada parameter data tambahan"}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-700 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
