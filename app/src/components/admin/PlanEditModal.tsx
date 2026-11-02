"use client";

import { useState, useTransition } from "react";
import { AdminPlatformPlan, upsertPlatformPlan, ActionResult } from "@/actions/adminBillingActions";
import { X, Sparkles, Check, Plus, Trash2, AlertCircle } from "lucide-react";

interface PlanEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: AdminPlatformPlan | null; // null if creating a new plan
  onSaved: (savedPlan: AdminPlatformPlan) => void;
}

interface PlanEditFormProps {
  plan: AdminPlatformPlan | null;
  onClose: () => void;
  onSaved: (savedPlan: AdminPlatformPlan) => void;
}

function PlanEditForm({ plan, onClose, onSaved }: PlanEditFormProps) {
  const isEditing = Boolean(plan?.id);

  const [code, setCode] = useState(plan?.code || "");
  const [name, setName] = useState(plan?.name || "");
  const [description, setDescription] = useState(plan?.description || "");
  const [price, setPrice] = useState<number>(plan?.price ?? 1000000);
  const [originalPrice, setOriginalPrice] = useState<string>(
    plan?.originalPrice !== undefined && plan?.originalPrice !== null
      ? String(plan.originalPrice)
      : ""
  );
  const [billingCycle, setBillingCycle] = useState(plan?.billingCycle || "MONTHLY");
  const [durationDays, setDurationDays] = useState<number>(plan?.durationDays ?? 30);
  const [maxUsers, setMaxUsers] = useState<number>(plan?.maxUsers ?? 10);
  const [maxJobFiles, setMaxJobFiles] = useState<number>(plan?.maxJobFiles ?? 500);
  const [badge, setBadge] = useState(plan?.badge || "");
  const [isPopular, setIsPopular] = useState(plan?.isPopular ?? false);
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState<number>(plan?.sortOrder ?? 0);

  // Features list
  const [features, setFeatures] = useState<string[]>(
    plan?.features || [
      "Manajemen Job File Unlimited",
      "Invoicing & Faktur Pajak Otomatis",
      "Integrasi QRIS BorderPay Real-time",
      "Akses Multi-User RBAC",
    ]
  );
  const [newFeatureText, setNewFeatureText] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText("");
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!code.trim()) {
      setErrorMsg("Kode paket wajib diisi (misal: STARTER, PRO, ENTERPRISE).");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("Nama paket wajib diisi.");
      return;
    }

    const parsedOriginalPrice =
      originalPrice.trim() !== "" && !isNaN(Number(originalPrice)) && Number(originalPrice) > 0
        ? Number(originalPrice)
        : null;

    startTransition(async () => {
      const res: ActionResult<AdminPlatformPlan> = await upsertPlatformPlan({
        id: plan?.id,
        code,
        name,
        description,
        price,
        originalPrice: parsedOriginalPrice,
        billingCycle,
        durationDays,
        maxUsers,
        maxJobFiles,
        features,
        badge,
        isPopular,
        isActive,
        sortOrder,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyimpan paket.");
      } else if (res.data) {
        onSaved(res.data);
        onClose();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Code */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            Kode Paket <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            disabled={isEditing}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CONTOH: PRO, ENTERPRISE"
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500 focus:outline-none uppercase disabled:opacity-60"
            required
          />
          <p className="text-[10px] text-zinc-500 mt-1">Identifikator unik di database.</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            Nama Tampilan Paket <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Bisnis Profesional"
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-amber-500 focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-zinc-300 font-semibold mb-1">Deskripsi Ringkas</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi untuk kartu penawaran..."
          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price (Promo / Aktif) */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            Harga Promo / Aktif (Rp) <span className="text-amber-400">*</span>
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
            required
          />
          <p className="text-[10px] text-emerald-400 mt-1 font-mono">
            Rp {price.toLocaleString("id-ID")}
          </p>
        </div>

        {/* Original / Strikethrough Price */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            Harga Normal / Coret (Rp) <span className="text-zinc-500 font-normal">(Opsional)</span>
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="Contoh: 3000000"
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
          />
          {originalPrice && !isNaN(Number(originalPrice)) && Number(originalPrice) > price ? (
            <p className="text-[10px] text-rose-400 mt-1 font-mono">
              Coret Rp {Number(originalPrice).toLocaleString("id-ID")} (Diskon {Math.round(((Number(originalPrice) - price) / Number(originalPrice)) * 100)}%)
            </p>
          ) : originalPrice && !isNaN(Number(originalPrice)) && Number(originalPrice) <= price ? (
            <p className="text-[10px] text-amber-400 mt-1">
              Catatan: Harga coret harus lebih besar dari harga aktif untuk menampilkan diskon.
            </p>
          ) : (
            <p className="text-[10px] text-zinc-500 mt-1">
              Kosongkan jika tidak ada harga coret / diskon.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Billing Cycle */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Siklus Penagihan</label>
          <select
            value={billingCycle}
            onChange={(e) => {
              const val = e.target.value;
              setBillingCycle(val);
              if (val === "YEARLY") setDurationDays(365);
              else if (val === "MONTHLY" || val === "PAY_PER_JOB") setDurationDays(30);
              else if (val === "TRIAL") setDurationDays(7);
            }}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-amber-500 focus:outline-none"
          >
            <option value="MONTHLY">Bulanan (Monthly)</option>
            <option value="YEARLY">Tahunan (Yearly)</option>
            <option value="PAY_PER_JOB">Pay-Per-Job (Per Job)</option>
            <option value="TRIAL">Uji Coba (Trial)</option>
          </select>
        </div>

        {/* Duration Days */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Durasi Aktif (Hari)</label>
          <input
            type="number"
            min={1}
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Max Users */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Batas Maksimal User</label>
          <input
            type="number"
            min={1}
            value={maxUsers}
            onChange={(e) => setMaxUsers(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Max Job Files */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Batas Maksimal Job Files</label>
          <input
            type="number"
            min={1}
            value={maxJobFiles}
            onChange={(e) => setMaxJobFiles(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Badge */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Label Badge (Opsional)</label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Paling Populer"
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">Urutan Tampilan</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Features Editor */}
      <div>
        <label className="block text-zinc-300 font-semibold mb-1.5">
          Daftar Fitur Unggulan Paket
        </label>
        <div className="space-y-1.5 mb-2.5">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-200"
            >
              <span className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{feat}</span>
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFeature(idx)}
                className="text-zinc-500 hover:text-rose-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newFeatureText}
            onChange={(e) => setNewFeatureText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddFeature();
              }
            }}
            placeholder="Tambah deskripsi fitur..."
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddFeature}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Toggles: isPopular, isActive */}
      <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-6 items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPopular}
            onChange={(e) => setIsPopular(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-zinc-300 font-medium">Highlight sebagai Paket Terpopuler</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-zinc-300 font-medium">Paket Aktif & Tersedia untuk Pembelian</span>
        </label>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
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
          {isPending ? "Menyimpan..." : isEditing ? "Perbarui Paket" : "Buat Paket"}
        </button>
      </div>
    </form>
  );
}

export function PlanEditModal({
  isOpen,
  onClose,
  plan,
  onSaved,
}: PlanEditModalProps) {
  if (!isOpen) return null;

  const isEditing = Boolean(plan?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? `Edit Paket: ${plan?.name}` : "Buat Paket Langganan Baru"}
              </h3>
              <p className="text-xs text-zinc-400">
                Konfigurasi harga, batas kuota, dan fitur paket SaaS Sistem Forwarding
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

        {/* Inner Form with key */}
        <PlanEditForm
          key={plan?.id ?? "new"}
          plan={plan}
          onClose={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
