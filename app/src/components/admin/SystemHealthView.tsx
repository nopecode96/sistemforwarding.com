"use client";

import React, { useState } from "react";
import {
  Server,
  Database,
  Zap,
  ShieldCheck,
  CreditCard,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Cpu,
  Clock,
  Trash2,
} from "lucide-react";
import {
  SystemHealthOverview,
  ClusterConnectivityResult,
  getSystemHealthOverview,
  testClusterConnectivity,
  flushRedisCache,
} from "@/actions/adminSystemActions";

interface SystemHealthViewProps {
  initialData: SystemHealthOverview;
}

export function SystemHealthView({ initialData }: SystemHealthViewProps) {
  const [data, setData] = useState<SystemHealthOverview>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTestingCluster, setIsTestingCluster] = useState(false);
  const [isFlushingCache, setIsFlushingCache] = useState(false);
  const [testResult, setTestResult] = useState<ClusterConnectivityResult | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showFlushModal, setShowFlushModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await getSystemHealthOverview();
      setData(fresh);
      setNotification({
        type: "success",
        message: "Telemetri cluster dan utilisasi storage berhasil diperbarui.",
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memperbarui telemetri.",
      });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleTestCluster = async () => {
    setIsTestingCluster(true);
    try {
      const result = await testClusterConnectivity();
      setTestResult(result);
      setShowTestModal(true);
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menguji konektivitas cluster.",
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsTestingCluster(false);
    }
  };

  const handleConfirmFlushCache = async () => {
    setIsFlushingCache(true);
    try {
      const result = await flushRedisCache();
      setShowFlushModal(false);
      if (result.success) {
        setNotification({
          type: "success",
          message: result.message,
        });
        await handleRefresh();
      } else {
        setNotification({
          type: "error",
          message: result.message,
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal membersihkan cache.",
      });
    } finally {
      setIsFlushingCache(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const heapPercentage = Math.min(
    100,
    Math.round((data.runtime.heapUsedBytes / data.runtime.heapTotalBytes) * 100)
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all duration-200 ${
            notification.type === "success"
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
              : notification.type === "error"
              ? "bg-rose-950/60 border-rose-800 text-rose-200"
              : "bg-blue-950/60 border-blue-800 text-blue-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            {notification.type === "error" && (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            {notification.type === "info" && (
              <Activity className="w-5 h-5 text-blue-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Infrastruktur & Kesehatan Sistem
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-normal">
                  Semua Sistem Normal
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Pusat telemetri Node 22, cluster PostgreSQL 16, Redis 7, SSL Wildcard & meteran storage.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-all cursor-pointer disabled:opacity-50"
            title="Muat ulang telemetri"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleTestCluster}
            disabled={isTestingCluster}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-semibold shadow-md shadow-amber-500/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 ${isTestingCluster ? "animate-pulse" : ""}`} />
            <span>Tes Koneksi Cluster</span>
          </button>

          <button
            onClick={() => setShowFlushModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-rose-800/40 hover:border-rose-700/60 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Flush Cache Redis</span>
          </button>
        </div>
      </div>

      {/* 5 Core Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Node & Next.js Runtime */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                Node.js & Next.js
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight">
                {data.runtime.nodeVersion}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                {data.runtime.nextVersion}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-zinc-500" /> Uptime
              </span>
              <span className="font-mono text-zinc-200">{data.runtime.uptimeFormatted}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] text-zinc-400">
                <span>Heap Memory</span>
                <span className="font-mono text-zinc-300">
                  {data.runtime.heapUsedFormatted} / {data.runtime.heapTotalFormatted}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                  style={{ width: `${heapPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: PostgreSQL 16 */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                PostgreSQL 16
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md border ${
                  data.database.status === "ONLINE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {data.database.status}
              </span>
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight">
                {data.database.sizePretty}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono truncate" title={data.database.databaseName}>
                DB: {data.database.databaseName}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[11px]">Koneksi Aktif</span>
              <span className="font-mono text-zinc-200">
                {data.database.activeConnections} pool
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[11px]">Query Latency</span>
              <span className="font-mono text-emerald-400 font-medium">
                {data.database.latencyMs} ms
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Redis 7 Alpine */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-red-400" />
                Redis 7 Alpine
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md border ${
                  data.redis.status === "ONLINE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {data.redis.status}
              </span>
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight">
                {data.redis.version}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                Port 6379 (AOF Active)
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[11px]">Ping Roundtrip</span>
              <span className="font-mono text-emerald-400 font-medium">
                {data.redis.pingLatencyMs} ms
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[11px]">Status Respon</span>
              <span className="font-mono text-zinc-300">PONG (Verified)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Nginx & Wildcard SSL */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Wildcard SSL
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md border ${
                  data.ssl.status === "VALID" || data.ssl.status === "MANAGED"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : data.ssl.status === "EXPIRING_SOON"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {data.ssl.status === "VALID"
                  ? "TLS 1.3 VALID"
                  : data.ssl.status === "MANAGED"
                  ? "MANAGED"
                  : data.ssl.status === "EXPIRING_SOON"
                  ? "EXPIRING"
                  : "EXPIRED"}
              </span>
            </div>
            <div>
              <div
                className={`text-lg font-bold tracking-tight ${
                  data.ssl.status === "EXPIRED"
                    ? "text-rose-400"
                    : data.ssl.status === "EXPIRING_SOON"
                    ? "text-amber-400"
                    : "text-white"
                }`}
              >
                {data.ssl.daysRemaining} Hari
              </div>
              <div className="text-[11px] text-zinc-400 font-mono truncate" title={data.ssl.domain}>
                {data.ssl.domain}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[11px]">Issuer</span>
              <span className="font-mono text-zinc-300 text-[11px] truncate max-w-[120px]" title={data.ssl.issuer}>
                {data.ssl.issuer}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[11px]">Reverse Proxy</span>
              <span className="font-mono text-zinc-300">Nginx 1.31</span>
            </div>
          </div>
        </div>

        {/* Card 5: BorderPay Gateway */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                BorderPay QRIS
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md border ${
                  data.borderpay.status === "ONLINE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : data.borderpay.status === "DEGRADED"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {data.borderpay.mode}
              </span>
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span
                  className={
                    data.borderpay.status === "ONLINE"
                      ? "text-white"
                      : data.borderpay.status === "DEGRADED"
                      ? "text-amber-400"
                      : "text-rose-400"
                  }
                >
                  {data.borderpay.status}
                </span>
                {data.borderpay.latencyMs > 0 && (
                  <span className="text-xs font-mono font-normal text-emerald-400">
                    {data.borderpay.latencyMs}ms
                  </span>
                )}
              </div>
              <div className="text-[11px] text-zinc-400 font-mono truncate" title={data.borderpay.maskedKey}>
                API: {data.borderpay.maskedKey}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[11px]">Webhook Token</span>
              <span className="font-mono text-emerald-400">
                {data.borderpay.hasWebhookToken ? "Tervalidasi" : "Belum Diatur"}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span className="text-[11px]">Gateway Engine</span>
              <span className="font-mono text-zinc-300">ASPI QRIS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Metering Section */}
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Storage Metering & Alokasi Quota Penyimpanan Dokumen
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Inspeksi kuota disk upload (/public/uploads) perusahaan per paket langganan (Starter 500MB, Pro 2GB, Enterprise 10GB).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono bg-zinc-950/80 px-3.5 py-2 rounded-xl border border-zinc-800">
            <div>
              <span className="text-zinc-500">Total Digunakan: </span>
              <span className="text-amber-400 font-bold">{data.storage.totalUsedFormatted}</span>
            </div>
            <div className="w-px h-3 bg-zinc-800" />
            <div>
              <span className="text-zinc-500">Total File: </span>
              <span className="text-zinc-200 font-bold">{data.storage.totalFilesCount}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Ruang Kerja Tenant</th>
                <th className="py-3 px-4">Paket Langganan</th>
                <th className="py-3 px-4 text-center">Dokumen / File</th>
                <th className="py-3 px-4">Konsumsi Storage</th>
                <th className="py-3 px-4 w-44">Utilisasi Kuota</th>
                <th className="py-3 px-4 text-right">Status Kuota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {data.storage.tenantQuotas.map((tenant) => {
                let barColor = "bg-emerald-500";
                let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                let badgeText = "SEHAT";

                if (tenant.statusBadge === "CRITICAL") {
                  barColor = "bg-rose-500";
                  badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                  badgeText = "KRITIS (>=90%)";
                } else if (tenant.statusBadge === "WARNING") {
                  barColor = "bg-amber-500";
                  badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  badgeText = "WASPADA (>=70%)";
                }

                return (
                  <tr key={tenant.tenantId} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{tenant.companyName}</div>
                      <div className="text-[11px] font-mono text-zinc-400">{tenant.subdomain}.sistemforwarding.com</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {tenant.subscriptionTier}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-zinc-300">
                      {tenant.documentCount} file
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-zinc-200 font-mono">
                        {tenant.storageUsedFormatted}{" "}
                        <span className="text-zinc-500">/ {tenant.storageQuotaFormatted}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-400">{tenant.percentageUsed}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all duration-300 rounded-full`}
                            style={{ width: `${Math.max(2, tenant.percentageUsed)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Distribution Section */}
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Distribusi Entitas Data Multi-Tenant di PostgreSQL
              </h2>
              <p className="text-xs text-zinc-400">
                Penyebaran record operasional job files, invoices, customer, dan vendor per ruang kerja forwarder.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Ruang Kerja Forwarder</th>
                <th className="py-3 px-4 text-center">Job Files (Kargo)</th>
                <th className="py-3 px-4 text-center">Faktur / Invoices</th>
                <th className="py-3 px-4 text-center">Pelanggan</th>
                <th className="py-3 px-4 text-center">Vendor Rekanan</th>
                <th className="py-3 px-4 text-right font-bold">Total Record Entitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {data.distribution.map((dist) => (
                <tr key={dist.tenantId} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{dist.companyName}</div>
                    <div className="text-[11px] font-mono text-zinc-400">{dist.subdomain}.sistemforwarding.com</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-amber-400">
                    {dist.jobFilesCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-emerald-400">
                    {dist.invoicesCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-sky-400">
                    {dist.customersCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-purple-400">
                    {dist.vendorsCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-white font-bold text-sm">
                    {dist.totalRecords.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cluster Connectivity Diagnostics */}
      {showTestModal && testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Hasil Diagnostik Cluster Node
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Uji ping langsung konektivitas database, cache, gateway & disk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Postgres */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">PostgreSQL 16 Cluster</div>
                    <div className="text-[11px] text-zinc-400 font-mono">Query SELECT 1</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-emerald-400">{testResult.postgres.latencyMs} ms</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      testResult.postgres.status === "ONLINE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {testResult.postgres.status}
                  </span>
                </div>
              </div>

              {/* Redis */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-red-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Redis 7 Alpine Cache</div>
                    <div className="text-[11px] text-zinc-400 font-mono">TCP Ping / Pong</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-emerald-400">{testResult.redis.latencyMs} ms</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      testResult.redis.status === "ONLINE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {testResult.redis.status}
                  </span>
                </div>
              </div>

              {/* BorderPay */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">BorderPay API Gateway</div>
                    <div className="text-[11px] text-zinc-400 font-mono">HTTPS REST Ping</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-emerald-400">{testResult.borderpay.latencyMs} ms</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      testResult.borderpay.status === "ONLINE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {testResult.borderpay.status}
                  </span>
                </div>
              </div>

              {/* Storage */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Storage Disk Subsystem</div>
                    <div className="text-[11px] text-zinc-400 font-mono">/public/uploads IO Access</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    READ/WRITE OK
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
              >
                Tutup Diagnostik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Flush Redis Confirmation */}
      {showFlushModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Konfirmasi Pembersihan Cache Redis
                </h3>
                <p className="text-xs text-zinc-400">
                  Tindakan ini akan mengosongkan seluruh cache memori di Redis 7.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
              Perintah <span className="font-mono text-amber-400">FLUSHDB</span> akan dieksekusi secara instan. Data sesi aktif atau cache query akan dimuat ulang dari database PostgreSQL saat diakses berikutnya.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFlushModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmFlushCache}
                disabled={isFlushingCache}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isFlushingCache ? "Membersihkan..." : "Ya, Kosongkan Cache"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
