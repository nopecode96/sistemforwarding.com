"use client";

import { useState, useTransition } from "react";
import { loginTenantAction } from "@/lib/auth-actions";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface TenantLoginFormProps {
  subdomain: string;
  companyName: string;
  defaultEmail: string;
}

export function TenantLoginForm({
  subdomain,
  companyName,
  defaultEmail,
}: TenantLoginFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    formData.set("subdomain", subdomain);

    startTransition(async () => {
      const res = await loginTenantAction(formData);
      if (!res.success) {
        setError(res.error || "Gagal masuk. Periksa kembali kredensial Anda.");
      } else {
        // Redirect to dashboard of this subdomain
        window.location.href = res.redirectUrl || "/";
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Email input */}
      <div>
        <label
          htmlFor="tenant-email"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          Email Perusahaan
        </label>
        <div className="relative rounded-xl shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Mail className="h-4 w-4" />
          </div>
          <input
            id="tenant-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            className="block w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {/* Password input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="tenant-password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Kata Sandi
          </label>
          <span className="text-xs text-slate-400">SSL 256-bit</span>
        </div>
        <div className="relative rounded-xl shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Lock className="h-4 w-4" />
          </div>
          <input
            id="tenant-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="block w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {/* Quick Demo Fill if on demo1 or demo2 */}
      {(subdomain === "demo1" || subdomain === "demo2") && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              setEmail(`${subdomain}@sistemforwarding.com`);
              setPassword("demo12345");
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200/80 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Masuk Cepat Demo: {subdomain}@sistemforwarding.com</span>
          </button>
        </div>
      )}

      {/* Submit button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Memverifikasi Akses {companyName}...</span>
            </>
          ) : (
            <>
              <span>Masuk ke Console Operasional</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
