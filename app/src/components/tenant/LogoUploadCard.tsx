"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { uploadTenantLogo } from "@/actions/settingsActions";
import { Upload, CheckCircle2, AlertCircle, ImageIcon, Loader2, RefreshCw } from "lucide-react";

interface LogoUploadCardProps {
  tenantId: string;
  tenantSubdomain: string;
  companyName: string;
  currentLogoUrl?: string | null;
}

export function LogoUploadCard({
  tenantId,
  tenantSubdomain,
  companyName,
  currentLogoUrl,
}: LogoUploadCardProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDisplayLogo = previewUrl || logoUrl || "/logo.png";
  const isCustomLogoActive = Boolean(previewUrl || logoUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setStatusMessage(null);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "Ukuran berkas melebihi batas 5 MB. Silakan pilih berkas yang lebih kecil.",
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setStatusMessage(null);
    const formData = new FormData();
    formData.append("logo", selectedFile);

    startTransition(async () => {
      try {
        const result = await uploadTenantLogo(tenantId, formData);

        if (result.success && result.logoUrl) {
          setLogoUrl(result.logoUrl);
          setPreviewUrl(null);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          setStatusMessage({
            type: "success",
            text: "Logo perusahaan berhasil diperbarui! Logo Anda kini tampil di Sidebar dan Header konsol operasional.",
          });
        } else {
          setStatusMessage({
            type: "error",
            text: result.error || "Gagal mengunggah logo perusahaan.",
          });
        }
      } catch (err: any) {
        setStatusMessage({
          type: "error",
          text: err.message || "Terjadi kesalahan saat memproses unggahan berkas.",
        });
      }
    });
  };

  return (
    <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-7 shadow-xs space-y-6 transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Logo Perusahaan Kustom</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ganti logo default Sistem Forwarding dengan identitas resmi {companyName}.
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isCustomLogoActive
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
              : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
          }`}
        >
          {isCustomLogoActive ? "Logo Kustom Aktif" : "Logo Default"}
        </span>
      </div>

      {/* Live Preview Box */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Pratinjau Tampilan Header / Sidebar
        </label>
        <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-white/[0.04] dark:to-white/[0.01] rounded-2xl p-6 border border-slate-200/90 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center p-2.5 shadow-xs">
              <Image
                src={activeDisplayLogo}
                alt={companyName}
                width={160}
                height={50}
                className="h-10 w-auto max-w-[170px] object-contain dark:brightness-110"
                unoptimized
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                {companyName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {tenantSubdomain}.sistemforwarding.com
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Status Resolusi</span>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
              {previewUrl
                ? "Pratinjau File Lokal"
                : logoUrl
                ? "Tersimpan di Cloud"
                : "Menggunakan Default"}
            </span>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleUploadSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Pilih Berkas Logo Baru
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
              onChange={handleFileChange}
              disabled={isPending}
              className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-50 dark:file:bg-violet-950/60 file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-100 dark:hover:file:bg-violet-900/40 file:cursor-pointer border border-slate-300 dark:border-white/10 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-white/[0.03] focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            Mendukung format PNG, JPG, WEBP, atau SVG. Ukuran maksimal 5 MB.
          </p>
        </div>

        {/* Feedback Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in duration-200 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <p className="leading-relaxed font-medium">{statusMessage.text}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {selectedFile && (
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={isPending}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
          )}

          <button
            type="submit"
            disabled={!selectedFile || isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan Logo...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Terapkan Logo Perusahaan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
