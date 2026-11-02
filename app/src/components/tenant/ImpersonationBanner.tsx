"use client";

import { useState } from "react";
import { stopTenantImpersonation } from "@/actions/adminAuditActions";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";

interface ImpersonationBannerProps {
  tenantName: string;
  operatorName: string;
}

export function ImpersonationBanner({
  tenantName,
  operatorName,
}: ImpersonationBannerProps) {
  const [isStopping, setIsStopping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStop = async () => {
    setIsStopping(true);
    setErrorMsg(null);
    try {
      const res = await stopTenantImpersonation();
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        setErrorMsg(res.error || "Gagal mengakhiri sesi impersonasi.");
        setIsStopping(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Terjadi kesalahan sistem.");
      setIsStopping(false);
    }
  };

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-zinc-950 px-4 py-2.5 shadow-lg border-b border-amber-400 font-sans transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-6 h-6 rounded-lg bg-zinc-950/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-zinc-950 animate-pulse" />
          </div>
          <div>
            <p className="font-bold leading-tight">
              Mode Impersonasi: Anda sedang mengakses ruang kerja{" "}
              <span className="underline decoration-zinc-900 underline-offset-2 font-black">
                {tenantName}
              </span>{" "}
              sebagai Super Admin{" "}
              <span className="font-black text-zinc-900">
                {operatorName}
              </span>
              . Semua tindakan diaudit.
            </p>
            {errorMsg && (
              <p className="text-[11px] font-bold text-red-950 mt-0.5">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleStop}
          disabled={isStopping}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 active:scale-95 text-amber-300 hover:text-white font-bold text-xs shadow-md transition-all shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isStopping ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
              <span>Mengembalikan Sesi...</span>
            </>
          ) : (
            <>
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
              <span>Akhiri Impersonasi &amp; Kembali ke Super Admin</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
