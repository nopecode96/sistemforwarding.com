"use client";

import { useState, useTransition } from "react";
import { loginAdminAction } from "@/lib/auth-actions";
import Link from "next/link";
import { Shield, Lock, Mail, ArrowRight, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("superadmin@sistemforwarding.com");
  const [password, setPassword] = useState("admin12345");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);

    startTransition(async () => {
      try {
        const res = await loginAdminAction(formData);
        if (!res.success) {
          setError(res.error || "Akses Super Admin ditolak.");
        } else {
          window.location.href = res.redirectUrl || "/";
        }
      } catch (err) {
        console.warn("[AdminLoginPage] Deployment update detected, reloading page...", err);
        window.location.reload();
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-zinc-100">
      {/* Dark Ambient Accents */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top back navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 px-4 sm:px-0">
        <Link
          href="https://sistemforwarding.com"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Utama</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 text-zinc-950 shadow-lg shadow-amber-500/20 mb-4">
              <Shield className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-400 text-[11px] font-bold tracking-wide uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Super Administrator Console</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Platform Governance
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              admin.sistemforwarding.com
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Email Administrator
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sistemforwarding.com"
                  className="block w-full rounded-xl border border-zinc-700 bg-zinc-800/70 pl-10 pr-3.5 py-2.5 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Security Key / Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-xl border border-zinc-700 bg-zinc-800/70 pl-10 pr-3.5 py-2.5 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/30 shadow-md shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-bold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Mengautentikasi Operator...</span>
                  </>
                ) : (
                  <>
                    <span>Buka Console Platform</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Strict RBAC Callout */}
          <div className="mt-8 pt-6 border-t border-zinc-800 text-center text-xs text-zinc-500">
            <p>
              Zona terbatas &bull; Setiap aktivitas login dan provisioning diaudit dalam sistem log.
            </p>
          </div>
        </div>

        {/* Client Workspace link */}
        <p className="mt-6 text-center text-xs text-zinc-500">
          Bukan administrator platform?{" "}
          <Link
            href="https://sistemforwarding.com/login"
            className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
          >
            Login Portal Klien Forwarder
          </Link>
        </p>
      </div>
    </div>
  );
}
