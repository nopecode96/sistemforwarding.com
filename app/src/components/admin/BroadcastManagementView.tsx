"use client";

import { useState, useTransition, useMemo } from "react";
import {
  AdminBroadcastItem,
  GetAdminBroadcastsResponse,
  toggleBroadcastActive,
  deleteAdminBroadcast,
} from "@/actions/adminBroadcastActions";
import {
  Megaphone,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Radio,
  AlertTriangle,
  Info,
  Sparkles,
  Flame,
} from "lucide-react";
import { BroadcastEditModal } from "./BroadcastEditModal";

interface BroadcastManagementViewProps {
  initialData: GetAdminBroadcastsResponse;
}

export function BroadcastManagementView({ initialData }: BroadcastManagementViewProps) {
  const [broadcasts, setBroadcasts] = useState<AdminBroadcastItem[]>(
    initialData.broadcasts
  );
  const [stats, setStats] = useState(initialData.stats);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<AdminBroadcastItem | null>(
    null
  );

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingBroadcast(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (broadcast: AdminBroadcastItem) => {
    setEditingBroadcast(broadcast);
    setIsModalOpen(true);
  };

  const handleSavedBroadcast = (saved: AdminBroadcastItem) => {
    setBroadcasts((prev) => {
      const idx = prev.findIndex((b) => b.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    // Recompute stats
    const now = new Date();
    setStats((prev) => {
      const isNew = !broadcasts.some((b) => b.id === saved.id);
      const isCurrentlyActive = (b: AdminBroadcastItem) =>
        b.isActive &&
        new Date(b.startsAt) <= now &&
        (!b.expiresAt || new Date(b.expiresAt) >= now);

      const savedIsActive = isCurrentlyActive(saved);

      if (isNew) {
        return {
          total: prev.total + 1,
          active: savedIsActive ? prev.active + 1 : prev.active,
          expired: !savedIsActive ? prev.expired + 1 : prev.expired,
        };
      } else {
        const oldBroadcast = broadcasts.find((b) => b.id === saved.id);
        const oldIsActive = oldBroadcast ? isCurrentlyActive(oldBroadcast) : false;
        let actDiff = 0;
        let expDiff = 0;
        if (oldIsActive !== savedIsActive) {
          actDiff = savedIsActive ? 1 : -1;
          expDiff = savedIsActive ? -1 : 1;
        }
        return {
          total: prev.total,
          active: prev.active + actDiff,
          expired: prev.expired + expDiff,
        };
      }
    });

    setNotification({
      type: "success",
      message: `Broadcast "${saved.title}" berhasil disimpan.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const isItemActive = (b: AdminBroadcastItem) => {
    const now = new Date();
    return (
      b.isActive &&
      new Date(b.startsAt) <= now &&
      (!b.expiresAt || new Date(b.expiresAt) >= now)
    );
  };

  const handleToggleActive = (broadcast: AdminBroadcastItem) => {
    const nextActive = !broadcast.isActive;
    startTransition(async () => {
      const res = await toggleBroadcastActive(broadcast.id, nextActive);
      if (res.success) {
        const wasActive = isItemActive(broadcast);
        const willBeActive = isItemActive({ ...broadcast, isActive: nextActive });
        const actDiff = wasActive === willBeActive ? 0 : willBeActive ? 1 : -1;
        const expDiff = wasActive === willBeActive ? 0 : willBeActive ? -1 : 1;

        setBroadcasts((prev) =>
          prev.map((b) => (b.id === broadcast.id ? { ...b, isActive: nextActive } : b))
        );
        setStats((prev) => ({
          total: prev.total,
          active: prev.active + actDiff,
          expired: prev.expired + expDiff,
        }));
        setNotification({
          type: "success",
          message: res.message || "Status broadcast berhasil diubah.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Gagal mengubah status broadcast.",
        });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  const handleDeleteBroadcast = (broadcast: AdminBroadcastItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus broadcast "${broadcast.title}"?`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteAdminBroadcast(broadcast.id);
      if (res.success) {
        const wasActive = isItemActive(broadcast);
        setBroadcasts((prev) => prev.filter((b) => b.id !== broadcast.id));
        setStats((prev) => ({
          total: prev.total - 1,
          active: wasActive ? prev.active - 1 : prev.active,
          expired: !wasActive ? prev.expired - 1 : prev.expired,
        }));
        setNotification({
          type: "success",
          message: res.message || "Broadcast berhasil dihapus.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Gagal menghapus broadcast.",
        });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  // Filtered Broadcasts
  const filteredBroadcasts = useMemo(() => {
    const now = new Date();
    return broadcasts.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          (item.targetSubdomain && item.targetSubdomain.toLowerCase().includes(q));
        if (!matches) return false;
      }

      const isItemActive =
        item.isActive &&
        new Date(item.startsAt) <= now &&
        (!item.expiresAt || new Date(item.expiresAt) >= now);

      if (statusFilter === "ACTIVE" && !isItemActive) return false;
      if (statusFilter === "EXPIRED" && isItemActive) return false;

      return true;
    });
  }, [broadcasts, search, statusFilter]);

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case "INFO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
            <Info className="w-3.5 h-3.5" />
            <span>INFO</span>
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>UPDATE</span>
          </span>
        );
      case "MAINTENANCE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>MAINTENANCE</span>
          </span>
        );
      case "ALERT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
            <Flame className="w-3.5 h-3.5" />
            <span>ALERT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg transition-all animate-in fade-in slide-in-from-top-4 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-semibold">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Broadcast Pengumuman Platform
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Fase 4
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Siarkan pengumuman real-time, jadwal maintenance, atau pembaruan rilis sistem ke workspace tenant.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-zinc-950 text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all transform hover:-translate-y-px"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Broadcast Baru</span>
        </button>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Pengumuman</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              {stats.total}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Megaphone className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Sedang Tayang (Aktif)</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.active}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nonaktif / Berakhir</p>
            <p className="text-2xl font-black text-zinc-600 dark:text-zinc-400 mt-1">
              {stats.expired}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pengumuman, pesan, atau tenant target..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusFilter === "ALL"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Semua ({broadcasts.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusFilter === "ACTIVE"
                ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Aktif ({stats.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("EXPIRED")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              statusFilter === "EXPIRED"
                ? "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Kadaluarsa ({stats.expired})
          </button>
        </div>
      </div>

      {/* Broadcasts Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tipe &amp; Judul Broadcast</th>
                <th className="py-3.5 px-4">Target Workspace</th>
                <th className="py-3.5 px-4">Masa Penayangan</th>
                <th className="py-3.5 px-4">Status Aktif</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredBroadcasts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Tidak ada broadcast yang cocok dengan kriteria filter.</p>
                  </td>
                </tr>
              ) : (
                filteredBroadcasts.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Urgency + Title & Message */}
                    <td className="py-4 px-4">
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center gap-2">
                          {renderTypeBadge(b.type)}
                          <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                            {b.title}
                          </h2>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {b.message}
                        </p>
                        {b.linkUrl && (
                          <div className="pt-0.5">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-600 dark:text-amber-400">
                              🔗 {b.linkLabel || b.linkUrl}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Target Audience */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {b.targetSubdomain ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                          <Globe className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{b.targetSubdomain}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 font-bold text-[11px] text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Semua Tenant</span>
                        </span>
                      )}
                    </td>

                    {/* Schedule / Validity */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="space-y-0.5 text-[11px]">
                        <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                          Mulai:{" "}
                          {new Date(b.startsAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                          Sampai:{" "}
                          {b.expiresAt
                            ? new Date(b.expiresAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Tanpa batas (Seterusnya)"}
                        </p>
                      </div>
                    </td>

                    {/* Active Toggle */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActive(b)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition-all ${
                          b.isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            b.isActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                          }`}
                        />
                        <span>{b.isActive ? "Aktif" : "Nonaktif"}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Edit Broadcast"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDeleteBroadcast(b)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Hapus Broadcast"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Broadcast Modal */}
      <BroadcastEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        broadcast={editingBroadcast}
        onSaved={handleSavedBroadcast}
      />
    </div>
  );
}
