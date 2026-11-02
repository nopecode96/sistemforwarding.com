"use client";

import { useState, useTransition } from "react";
import {
  AdminBroadcastItem,
  upsertAdminBroadcast,
  BroadcastActionResult,
  BroadcastType,
} from "@/actions/adminBroadcastActions";
import {
  X,
  Megaphone,
  Sparkles,
  AlertCircle,
  Info,
  AlertTriangle,
  Flame,
  Calendar,
  Globe,
  Link as LinkIcon,
} from "lucide-react";

interface BroadcastEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  broadcast: AdminBroadcastItem | null;
  onSaved: (saved: AdminBroadcastItem) => void;
}

interface BroadcastEditFormProps {
  broadcast: AdminBroadcastItem | null;
  onClose: () => void;
  onSaved: (saved: AdminBroadcastItem) => void;
}

function formatDateForInput(isoString?: string | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function BroadcastEditForm({
  broadcast,
  onClose,
  onSaved,
}: BroadcastEditFormProps) {
  const isEditing = Boolean(broadcast?.id);

  const [title, setTitle] = useState(broadcast?.title || "");
  const [message, setMessage] = useState(broadcast?.message || "");
  const [type, setType] = useState<BroadcastType | string>(
    broadcast?.type || "INFO"
  );
  const [targetType, setTargetType] = useState<"ALL" | "SPECIFIC">(
    broadcast?.targetSubdomain ? "SPECIFIC" : "ALL"
  );
  const [targetSubdomain, setTargetSubdomain] = useState(
    broadcast?.targetSubdomain || ""
  );
  const [linkUrl, setLinkUrl] = useState(broadcast?.linkUrl || "");
  const [linkLabel, setLinkLabel] = useState(broadcast?.linkLabel || "");
  const [isActive, setIsActive] = useState(broadcast?.isActive ?? true);

  const [startsAt, setStartsAt] = useState(
    formatDateForInput(broadcast?.startsAt) || formatDateForInput(new Date().toISOString())
  );
  const [hasExpiry, setHasExpiry] = useState(Boolean(broadcast?.expiresAt));
  const [expiresAt, setExpiresAt] = useState(
    formatDateForInput(broadcast?.expiresAt) || ""
  );

  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Judul pengumuman wajib diisi.");
      return;
    }
    if (!message.trim()) {
      setErrorMsg("Isi pesan pengumuman wajib diisi.");
      return;
    }
    if (targetType === "SPECIFIC" && !targetSubdomain.trim()) {
      setErrorMsg("Tentukan subdomain tenant target atau pilih Semua Tenant.");
      return;
    }

    startTransition(async () => {
      const res: BroadcastActionResult<AdminBroadcastItem> = await upsertAdminBroadcast({
        id: broadcast?.id,
        title: title.trim(),
        message: message.trim(),
        type,
        linkUrl: linkUrl.trim() || null,
        linkLabel: linkLabel.trim() || null,
        targetSubdomain: targetType === "SPECIFIC" ? targetSubdomain.trim() : null,
        isActive,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: hasExpiry && expiresAt ? new Date(expiresAt) : null,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyimpan broadcast pengumuman.");
      } else if (res.data) {
        onSaved(res.data);
        onClose();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {isEditing ? "Edit Broadcast Platform" : "Buat Broadcast Pengumuman"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Siarkan pengumuman atau pemeliharaan server ke seluruh workspace tenant.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body / Scrollable Content */}
      <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1 text-xs">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2.5 text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Urgency Type */}
        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Tipe Broadcast &amp; Tingkat Urgensi <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                id: "INFO",
                label: "INFO",
                desc: "Informasi umum / tips",
                icon: Info,
                activeClass:
                  "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
              },
              {
                id: "UPDATE",
                label: "UPDATE",
                desc: "Rilis fitur baru",
                icon: Sparkles,
                activeClass:
                  "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
              },
              {
                id: "MAINTENANCE",
                label: "MAINTENANCE",
                desc: "Jadwal downtime / patch",
                icon: AlertTriangle,
                activeClass:
                  "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300",
              },
              {
                id: "ALERT",
                label: "ALERT",
                desc: "Peringatan mendesak",
                icon: Flame,
                activeClass:
                  "border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? `${item.activeClass} ring-2 ring-blue-500/20 font-bold`
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-extrabold text-xs">{item.label}</span>
                  </div>
                  <p className="text-[10px] opacity-80">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Judul Broadcast <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Pemeliharaan Database PostgreSQL Terjadwal - Minggu 23:00 WIB"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Pesan Pengumuman Lengkap <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tuliskan detail pengumuman yang akan ditampilkan pada floating banner workspace tenant..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            required
          />
        </div>

        {/* Target Audience */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
            Target Audiens / Workspace
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="targetAudience"
                checked={targetType === "ALL"}
                onChange={() => setTargetType("ALL")}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="font-bold text-zinc-900 dark:text-zinc-200">
                Semua Tenant (Platform-Wide)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="targetAudience"
                checked={targetType === "SPECIFIC"}
                onChange={() => setTargetType("SPECIFIC")}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="font-bold text-zinc-900 dark:text-zinc-200">
                Tenant Khusus (Subdomain)
              </span>
            </label>
          </div>

          {targetType === "SPECIFIC" && (
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={targetSubdomain}
                  onChange={(e) => setTargetSubdomain(e.target.value.toLowerCase())}
                  placeholder="Ketik subdomain tenant, misal: demo1, bsd-cargo..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[11px] font-mono text-zinc-400">
                  .sistemforwarding.com
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CTA Link Action (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Link Tautan CTA (Opsional)
            </label>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://... atau /finance"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Label Tombol CTA
            </label>
            <input
              type="text"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Contoh: Lihat Detail, Perpanjang Sekarang"
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Active Toggle & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Mulai Tayang (Starts At)</span>
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Tetapkan Waktu Berakhir (Expires At)
                </span>
              </label>
              {hasExpiry && (
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-none mt-1"
                />
              )}
            </div>
          </div>

          <div className="pt-5">
            <label className="flex items-center gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-zinc-300 focus:ring-amber-500"
              />
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                  Broadcast Aktif
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Bila dinonaktifkan, pengumuman tidak akan muncul ke tenant.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/30">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-semibold transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-zinc-950 font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all disabled:opacity-60"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Megaphone className="w-4 h-4" />
              <span>{isEditing ? "Simpan Perubahan" : "Kirimkan Broadcast"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function BroadcastEditModal({
  isOpen,
  onClose,
  broadcast,
  onSaved,
}: BroadcastEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <BroadcastEditForm
          broadcast={broadcast}
          onClose={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
