"use client";

import { useState, useTransition } from "react";
import {
  AdminPlatformPlan,
  togglePlatformPlanActive,
  deletePlatformPlan,
} from "@/actions/adminBillingActions";
import {
  Plus,
  Check,
  CreditCard,
  Users,
  Ship,
  Clock,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PlanEditModal } from "./PlanEditModal";

interface PlansManagementViewProps {
  initialPlans: AdminPlatformPlan[];
}

export function PlansManagementView({ initialPlans }: PlansManagementViewProps) {
  const [plans, setPlans] = useState<AdminPlatformPlan[]>(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlatformPlan | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: AdminPlatformPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleSavedPlan = (savedPlan: AdminPlatformPlan) => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === savedPlan.id || p.code === savedPlan.code);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedPlan;
        return next;
      }
      return [...prev, savedPlan];
    });
    setNotification({
      type: "success",
      message: `Paket "${savedPlan.name}" (${savedPlan.code}) berhasil disimpan.`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleActive = (plan: AdminPlatformPlan) => {
    const nextState = !plan.isActive;
    startTransition(async () => {
      const res = await togglePlatformPlanActive(plan.id, nextState);
      if (res.success) {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, isActive: nextState } : p))
        );
        setNotification({
          type: "success",
          message: res.message || "Status paket berhasil diubah.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Gagal mengubah status paket.",
        });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  const handleDeletePlan = (plan: AdminPlatformPlan) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus/menonaktifkan paket "${plan.name}" (${plan.code})?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deletePlatformPlan(plan.id);
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
        setNotification({
          type: "success",
          message: res.message || "Paket berhasil dihapus.",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Gagal menghapus paket.",
        });
      }
      setTimeout(() => setNotification(null), 4000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Paket Langganan Platform
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              SaaS Pricing Suite
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Konfigurasi tier paket SaaS, kuota user, batas job files, dan fitur produk SistemForwarding.com
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Paket Baru</span>
        </button>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border animate-in fade-in duration-200 ${
            notification.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-white text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
              plan.isPopular
                ? "bg-zinc-900/90 border-amber-500/50 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30"
                : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80"
            }`}
          >
            {/* Top Ribbon / Badge */}
            {plan.badge && (
              <div className="absolute top-0 right-0">
                <span
                  className={`inline-block px-3 py-1 rounded-bl-xl text-[10px] font-mono font-bold uppercase tracking-wider ${
                    plan.isPopular
                      ? "bg-amber-500 text-zinc-950"
                      : "bg-zinc-800 text-zinc-300 border-l border-b border-zinc-700"
                  }`}
                >
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="p-6 space-y-4">
              {/* Header Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {plan.code}
                  </span>
                  {!plan.isActive && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
                      NONAKTIF
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mt-2 leading-tight">
                  {plan.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 min-h-[32px]">
                  {plan.description || "Paket langganan operasional Sistem Forwarding."}
                </p>
              </div>

              {/* Price Banner */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                {plan.originalPrice && plan.originalPrice > plan.price && (
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      Diskon {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                      Hemat Rp {(plan.originalPrice - plan.price).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline flex-wrap gap-y-1">
                  {plan.originalPrice && plan.originalPrice > plan.price && (
                    <span className="line-through text-zinc-500 text-sm sm:text-base mr-2 font-mono font-medium">
                      Rp {plan.originalPrice.toLocaleString("id-ID")}
                    </span>
                  )}
                  <span className="text-2xl font-black text-white font-mono tracking-tight">
                    Rp {plan.price.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium ml-1.5">
                    {plan.billingCycle === "YEARLY"
                      ? "/ tahun"
                      : plan.billingCycle === "PAY_PER_JOB"
                      ? "/ job"
                      : plan.billingCycle === "TRIAL"
                      ? "/ 7 hari"
                      : "/ bulan"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {plan.durationDays} Hari Aktif
                  </span>
                  {plan.invoicesCount !== undefined && plan.invoicesCount > 0 && (
                    <span className="flex items-center gap-1 font-mono text-zinc-400">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                      {plan.invoicesCount} Invoice Terbit
                    </span>
                  )}
                </div>
              </div>

              {/* Quotas & Limits */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400">Maks. Operator</p>
                    <p className="text-xs font-bold text-white font-mono">
                      {plan.maxUsers >= 999 ? "Unlimited" : `${plan.maxUsers} User`}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Ship className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400">Batas Job File</p>
                    <p className="text-xs font-bold text-white font-mono">
                      {plan.maxJobFiles >= 9999 ? "Unlimited" : `${plan.maxJobFiles} File`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Bullet Points */}
              <div className="pt-2 border-t border-zinc-800/80">
                <p className="text-[11px] font-bold text-zinc-300 mb-2 uppercase tracking-wider font-mono">
                  Fitur Paket:
                </p>
                <ul className="space-y-1.5">
                  {plan.features.slice(0, 6).map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  {plan.features.length > 6 && (
                    <li className="text-[11px] text-zinc-400 font-mono italic pl-5">
                      + {plan.features.length - 6} fitur lainnya...
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Card Action Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleActive(plan)}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  plan.isActive
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                }`}
              >
                {plan.isActive ? "Aktif" : "Nonaktif"}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePlan(plan)}
                  title="Hapus / Arsipkan Paket"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      <PlanEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={editingPlan}
        onSaved={handleSavedPlan}
      />
    </div>
  );
}
