"use client";

import { useState } from "react";
import { AdminTenantItem } from "@/actions/adminTenantActions";
import {
  KeyRound,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface TenantResetAccessModalProps {
  tenant: AdminTenantItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReset: (
    tenantId: string,
    targetUserId?: string,
    customPassword?: string
  ) => Promise<{
    userId: string;
    userName: string;
    userEmail: string;
    temporaryPassword: string;
  }>;
  isLoading?: boolean;
}

export function TenantResetAccessModal({
  tenant,
  isOpen,
  onClose,
  onReset,
  isLoading = false,
}: TenantResetAccessModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [customPassword, setCustomPassword] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    userName: string;
    userEmail: string;
    temporaryPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !tenant) return null;

  const users = tenant.users || [];
  const defaultUser =
    tenant.primaryAdmin || users.find((u) => u.role === "TENANT_ADMIN") || users[0];

  const effectiveUserId = selectedUserId || defaultUser?.id || "";

  const handleClose = () => {
    setResult(null);
    setError(null);
    setCustomPassword("");
    setIsCustomMode(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await onReset(
        tenant.id,
        effectiveUserId || undefined,
        isCustomMode && customPassword.trim() ? customPassword.trim() : undefined
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset kata sandi administrator.");
    }
  };

  const workspaceUrl = `https://${tenant.subdomain}.sistemforwarding.com`;

  const handleCopyCredentials = async () => {
    if (!result) return;
    const textToCopy = `=== Kredensial Akses Ruang Kerja SistemForwarding.com ===\nPerusahaan: ${tenant.companyName}\nPortal Login: ${workspaceUrl}/login\nEmail Pengguna: ${result.userEmail}\nNama Pengguna: ${result.userName}\nPassword Sementara: ${result.temporaryPassword}\n======================================================`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
    } catch {
      // Ignore clipboard error
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset Akses Administrator</h3>
              <p className="text-xs text-zinc-400 font-mono">{tenant.companyName}</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {result ? (
          /* Success Screen with Copyable Credentials */
          <div className="p-6 space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-200">
                  Kredensial Berhasil Direset!
                </p>
                <p className="text-[11px] text-emerald-300 mt-0.5">
                  Akun pengguna telah diaktifkan kembali dan siap digunakan untuk login.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Target User:</span>
                <span className="text-white font-semibold">{result.userName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Email Login:</span>
                <span className="text-amber-400">{result.userEmail}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400">Password Baru:</span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-300 font-black tracking-wider select-all">
                  {result.temporaryPassword}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Portal Login:</span>
                <a
                  href={`${workspaceUrl}/login`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                >
                  {workspaceUrl}/login
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />
                    <span>Kredensial Tersalin ke Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-950" />
                    <span>Salin Seluruh Kredensial</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          /* Form for Triggering Reset */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="text-xs text-zinc-400 leading-relaxed">
              Tindakan ini akan mereset password pengguna terpilih, memastikan status akun tetap aktif,
              dan menghasilkan kunci akses baru untuk diserahkan ke administrator tenant.
            </div>

            {/* User Target Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Pilih Akun yang Direset
              </label>
              {users.length > 0 ? (
                <select
                  value={effectiveUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} &bull; {u.email} ({u.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-xs text-zinc-400">
                  Belum ada pengguna terdaftar pada tenant ini.
                </div>
              )}
            </div>

            {/* Mode: Auto Generated vs Custom Password */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Password Baru
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono"
                >
                  {isCustomMode ? "Gunakan Password Otomatis Acak" : "Atur Password Kustom"}
                </button>
              </div>

              {isCustomMode ? (
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Ketik password baru yang diinginkan..."
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono"
                />
              ) : (
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between font-mono">
                  <span>Sistem akan membuat sandi acak aman:</span>
                  <span className="text-amber-400 font-bold">SF-XXXXXX!999</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all border border-zinc-700"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isLoading || users.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Reset & Buat Kredensial</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
