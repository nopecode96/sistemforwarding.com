"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authenticateUser, LoginActionResult } from "./actions";
import { Ship, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<LoginActionResult | null, FormData>(
    authenticateUser,
    null
  );

  useEffect(() => {
    if (state?.success && state.redirectUrl) {
      router.push(state.redirectUrl);
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <Link href="/" className="inline-block mb-3 group">
          <Image
            src="/logo.png"
            alt="sistemforwarding.com - Konsol Operasional"
            width={210}
            height={70}
            className="h-14 sm:h-16 w-auto object-contain mx-auto transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Konsol Operasional Forwarding
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          Masuk ke ruang kerja multi-tenant TMS Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200/80">
          <form action={formAction} className="space-y-5">
            {/* Error Feedback */}
            {state?.error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-sm text-red-700 animate-in fade-in duration-200">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{state.error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email Perusahaan
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue="demo1@sistemforwarding.com"
                  placeholder="nama@perusahaan.com"
                  className="block w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Quick Demo Selectors */}
              <div className="flex items-center gap-2 pt-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Pilihan Demo:</span>
                <button
                  type="button"
                  onClick={() => {
                    const emailInput = document.getElementById("email") as HTMLInputElement;
                    if (emailInput) emailInput.value = "demo1@sistemforwarding.com";
                  }}
                  className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                >
                  Demo 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const emailInput = document.getElementById("email") as HTMLInputElement;
                    if (emailInput) emailInput.value = "demo2@sistemforwarding.com";
                  }}
                  className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                >
                  Demo 2
                </button>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Kata Sandi
                </label>
                <span className="text-xs text-slate-400">Terproteksi SSL 256-bit</span>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue="demo12345"
                  placeholder="••••••••••••"
                  className="block w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Remember Me / Session */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-600">Tetap masuk di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Memverifikasi Akses...</span>
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

          {/* Strict Enterprise Callout: No Self-Registration Allowed */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-600">
                <p className="font-semibold text-slate-900 mb-0.5">Akses B2B Tertutup</p>
                <p>
                  Pendaftaran tenant baru hanya dilayani melalui kontrak dan proses onboarding resmi.
                  Bila Anda belum memiliki akses, hubungi Administrator Perusahaan atau tim onboarding{" "}
                  <span className="font-semibold text-slate-700">sistemforwarding.com</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} sistemforwarding.com. Platform Multi-Tenant Freight Forwarding.
        </p>
      </div>
    </div>
  );
}
