"use client";

import { useEffect } from "react";
import { LogOut, Loader2, AlertTriangle, X } from "lucide-react";
import { getUserInitials } from "@/lib/auth-utils";

interface AdminLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isPending: boolean;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export function AdminLogoutModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  userName = "Super Administrator",
  userEmail = "superadmin@sistemforwarding.com",
  userRole = "SUPERADMIN",
}: AdminLogoutModalProps) {
  // Lock background scroll when modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const initials = getUserInitials(userName, "SA");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      {/* Click outside to close (disabled when pending) */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isPending) onClose();
        }}
      />

      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-zinc-100 z-10 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isPending}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/70 border border-rose-800/80 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/30">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3
              id="logout-modal-title"
              className="text-base sm:text-lg font-bold text-white tracking-tight"
            >
              Konfirmasi Logout
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Sesi otentikasi Root Governance Anda pada platform SistemForwarding akan diakhiri dan cookie sesi akan dibersihkan secara aman.
            </p>
          </div>
        </div>

        {/* Current Operator Card Preview */}
        <div className="mt-5 p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/90 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-black text-xs shrink-0 shadow-md shadow-amber-500/20">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">
                {userName}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {userRole}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
              {userEmail}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengakhiri Sesi...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Keluar Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
