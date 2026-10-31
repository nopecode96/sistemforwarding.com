"use client";

import { useState, useTransition, useEffect } from "react";
import {
  checkSubdomainAvailability,
  registerNewTenant,
  simulateBorderPayPayment,
  checkPaymentStatus,
  RegisterTenantResult,
} from "@/actions/onboardingActions";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
  Building2,
  Sparkles,
  Lock,
  QrCode,
  ExternalLink,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

interface OnboardingWizardProps {
  initialPlan?: "trial" | "monthly" | "yearly";
}

export function OnboardingWizard({ initialPlan = "trial" }: OnboardingWizardProps) {
  // Step: 1 = Google SSO, 2 = Tenant Details, 3 = Confirmation / QRIS
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<"trial" | "monthly" | "yearly">(
    initialPlan
  );

  // Google User State
  const [googleUser, setGoogleUser] = useState<{
    name: string;
    email: string;
    avatarUrl: string;
  } | null>(null);

  // Tenant Form State
  const [companyName, setCompanyName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [availability, setAvailability] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [registrationResult, setRegistrationResult] = useState<RegisterTenantResult | null>(
    null
  );

  // Payment Webhook Simulation & QR state
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate authentic QR code data URL whenever paymentDetails are available
  useEffect(() => {
    if (registrationResult?.paymentDetails?.qrisString) {
      QRCode.toDataURL(registrationResult.paymentDetails.qrisString, {
        width: 320,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Failed to generate QRIS:", err));
    }
  }, [registrationResult?.paymentDetails?.qrisString]);

  // Real-time auto-polling for payment confirmation (detects live QRIS webhook callback)
  useEffect(() => {
    if (step !== 3 || !registrationResult?.requiresPayment || isPaymentConfirmed) {
      return;
    }

    const pollInterval = setInterval(async () => {
      if (!registrationResult.subdomain) return;
      const res = await checkPaymentStatus(registrationResult.subdomain);
      if (res.isPaid) {
        setIsPaymentConfirmed(true);
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [step, registrationResult, isPaymentConfirmed]);

  // Google OAuth Popup State
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Listen to messages from the Google popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS" && event.data.user) {
        setGoogleUser(event.data.user);
        setIsGoogleLoading(false);
        setGoogleError(null);
        setStep(2);
      } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
        setIsGoogleLoading(false);
        setGoogleError(event.data.error || "Gagal verifikasi akun Google.");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Open a small new popup window for Google OAuth
  const handleGoogleSignInPopup = () => {
    setIsGoogleLoading(true);
    setGoogleError(null);

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID ||
      "";

    // Redirect to the exact authorized redirect URI registered in Google Console
    const isProduction = window.location.hostname.includes("sistemforwarding.com");
    const redirectUri = isProduction
      ? "https://www.sistemforwarding.com"
      : window.location.origin;

    // Small window popup dimensions (centered)
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid%20profile%20email&prompt=select_account`;

    const popup = window.open(
      googleAuthUrl,
      "GoogleSignInPopup",
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      setIsGoogleLoading(false);
      setGoogleError("Jendela popup diblokir oleh browser. Harap izinkan popup di browser Anda.");
      return;
    }

    try {
      popup.focus();
    } catch {
      // Ignore if focus fails
    }

    // Polling to detect if user manually closes the popup window without completing
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        setIsGoogleLoading(false);
      }
    }, 800);
  };

  // Google SSO Mock Trigger for quick demo
  const handleGoogleLogin = (mockName: string, mockEmail: string, defaultCompany?: string, defaultSub?: string) => {
    setGoogleUser({
      name: mockName,
      email: mockEmail,
      avatarUrl: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    });
    if (defaultCompany) setCompanyName(defaultCompany);
    if (defaultSub) setSubdomain(defaultSub);
    setStep(2);
  };

  // Real-time Subdomain Validation
  useEffect(() => {
    const clean = subdomain.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setAvailability(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSubdomain(true);
      const res = await checkSubdomainAvailability(clean);
      setAvailability({
        checked: true,
        available: res.available,
        message: res.message,
      });
      setIsCheckingSubdomain(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomain]);

  // Handle Form Submission
  const handleSubmitTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) return;
    if (!availability?.available) return;

    startTransition(async () => {
      const result = await registerNewTenant({
        companyName,
        subdomain,
        plan: selectedPlan,
        user: googleUser,
      });

      setRegistrationResult(result);
      if (result.success) {
        setStep(3);
      }
    });
  };

  // Simulate BorderPay Webhook callback in real-time
  const handleSimulateBorderPayWebhook = async () => {
    if (!registrationResult?.paymentDetails?.referenceId) return;

    setIsSimulatingPayment(true);
    try {
      const result = await simulateBorderPayPayment(
        registrationResult.paymentDetails.referenceId,
        registrationResult.subdomain || "",
        googleUser?.email,
        registrationResult.paymentDetails.amount
      );

      if (result.ok) {
        setIsPaymentConfirmed(true);
      } else {
        console.warn("Simulasi webhook gagal dengan status:", result.status);
      }
    } catch (err) {
      console.error("Webhook trigger failed", err);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-slate-800 relative overflow-hidden flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400/15 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/40 shadow-md group-hover:bg-white transition-all">
            <Image
              src="/logo.png"
              alt="sistemforwarding.com"
              width={160}
              height={40}
              className="h-8 sm:h-9 w-auto object-contain"
              priority
            />
          </div>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-200 hover:text-white transition-colors bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-2xl">
          {/* Header Title & Stepper */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Aktivasi Ruang Kerja Mandiri</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Pendaftaran Konsol Autopilot
            </h1>
            <p className="text-sm text-blue-200/80 mt-2 max-w-md mx-auto">
              Siapkan sistem manajemen kargo dan keuangan untuk perusahaan freight forwarding Anda dalam 2 menit.
            </p>

            {/* Stepper Pills */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6">
              {/* Step 1 Pill */}
              <div
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  step === 1
                    ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300"
                    : step > 1
                    ? "bg-blue-600/60 text-cyan-200 border border-blue-400/40"
                    : "bg-white/10 text-blue-200/50"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
                  {step > 1 ? "✓" : "1"}
                </span>
                <span>Google SSO</span>
              </div>

              <div className="w-4 sm:w-6 h-0.5 bg-blue-700/50" />

              {/* Step 2 Pill */}
              <div
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  step === 2
                    ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300"
                    : step > 2
                    ? "bg-blue-600/60 text-cyan-200 border border-blue-400/40"
                    : "bg-white/10 text-blue-200/50"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
                  {step > 2 ? "✓" : "2"}
                </span>
                <span>Data Tenant</span>
              </div>

              <div className="w-4 sm:w-6 h-0.5 bg-blue-700/50" />

              {/* Step 3 Pill */}
              <div
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  step === 3
                    ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300"
                    : "bg-white/10 text-blue-200/50"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Aktivasi</span>
              </div>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* STEP 1: GOOGLE SSO */}
          {/* ==================================================================== */}
          {step === 1 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 sm:p-10 space-y-6">
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheck className="h-7 w-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Langkah 1: Hubungkan Akun Google Anda
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Untuk menjamin keamanan otentikasi enterprise, pendaftaran ruang kerja diverifikasi langsung melalui akun Google resmi perusahaan Anda.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Real Google SSO Trigger with Small Popup Window */}
                <button
                  type="button"
                  onClick={handleGoogleSignInPopup}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-400 text-slate-800 text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 transform active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span>Menunggu verifikasi di jendela Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Lanjutkan dengan Akun Google</span>
                    </>
                  )}
                </button>

                {/* Google Error Feedback */}
                {googleError && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>{googleError}</span>
                  </div>
                )}

                {/* Quick Profile Simulation */}
                <div className="pt-4 border-t border-slate-100">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
                    Atau masuk cepat dengan profil simulasi:
                  </span>
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        handleGoogleLogin("Admin PT Demo 1", "demo1@sistemforwarding.com", "PT. Demo 1 Company", "demo1")
                      }
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50/60 hover:border-blue-300 text-left transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800 text-xs group-hover:text-blue-700">
                            Demo 1 &bull; PT. Demo 1 Company
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            demo1@sistemforwarding.com
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-100/70 px-2.5 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        Pilih Demo 1 &rarr;
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* STEP 2: TENANT DETAILS */}
          {/* ==================================================================== */}
          {step === 2 && googleUser && (
            <form
              onSubmit={handleSubmitTenant}
              className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 sm:p-10 space-y-6 animate-in fade-in duration-300"
            >
              {/* Verified Badge */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                    {googleUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{googleUser.name}</p>
                    <p className="text-[11px] text-slate-500">{googleUser.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shadow-sm">
                  <Check className="h-3 w-3" />
                  Google Terverifikasi
                </span>
              </div>

              {/* Plan Choice Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Pilihan Paket Langganan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("trial")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      selectedPlan === "trial"
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">Trial 7 Hari</span>
                    <span className="block text-sm font-extrabold text-blue-600 mt-1">Rp 0</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Gratis tanpa kartu kredit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan("monthly")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      selectedPlan === "monthly"
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-xs font-bold text-slate-900">Bulanan</span>
                    <span className="block text-sm font-extrabold text-blue-600 mt-1">Rp 1.000.000</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Fitur komplit bulanan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan("yearly")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      selectedPlan === "yearly"
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/30 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="block text-xs font-bold text-slate-900">Tahunan</span>
                      <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        Hemat
                      </span>
                    </div>
                    <span className="block text-sm font-extrabold text-emerald-600 mt-1">Rp 10.000.000</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Hemat 2 bulan</span>
                  </button>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Perusahaan Freight Forwarding *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Contoh: PT Samudra Cargo Express"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                  <Building2 className="absolute right-4 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Subdomain Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Pilih Subdomain Unik Ruang Kerja *
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                  <span className="px-3.5 text-xs font-mono text-slate-400 bg-slate-50 border-r border-slate-200 py-3">
                    https://
                  </span>
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="demo1"
                    className="flex-1 px-3 py-3 text-sm font-mono font-bold text-blue-700 focus:outline-none"
                  />
                  <span className="px-3.5 text-xs font-mono text-slate-400 bg-slate-50 border-l border-slate-200 py-3">
                    .sistemforwarding.com
                  </span>
                </div>

                {/* Subdomain Availability Feedback */}
                <div className="mt-2 text-xs flex items-center gap-1.5">
                  {isCheckingSubdomain && (
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                      Memeriksa ketersediaan ke database PostgreSQL...
                    </span>
                  )}
                  {!isCheckingSubdomain && availability && (
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        availability.available ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {availability.available ? "✓ " : "✗ "}
                      {availability.message}
                    </span>
                  )}
                  {!isCheckingSubdomain && !availability && (
                    <span className="text-slate-400">
                      Gunakan huruf kecil, angka, dan tanda hubung (-) minimal 3 karakter.
                    </span>
                  )}
                </div>
              </div>

              {/* Error feedback */}
              {registrationResult?.error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{registrationResult.error}</span>
                </div>
              )}

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !availability?.available || !companyName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                      <span>Membuat Workspace di PostgreSQL...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {selectedPlan === "trial"
                          ? "Aktifkan Trial 7 Hari Sekarang"
                          : "Lanjutkan ke Pembayaran QRIS"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ==================================================================== */}
          {/* STEP 3: ACTIVATION / QRIS PAYMENT */}
          {/* ==================================================================== */}
          {step === 3 && registrationResult && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 sm:p-10 space-y-6 animate-in fade-in duration-300">
              {!registrationResult.requiresPayment || isPaymentConfirmed ? (
                <div className="text-center space-y-5 py-4">
                  <div className="h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 border border-emerald-100">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      Selamat! Ruang Kerja Anda Telah Aktif
                    </h2>
                    <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                      Tenant <strong className="text-slate-900">{companyName}</strong> telah berhasil diprovisi secara otomatis lengkap dengan isolasi data dan MasterPrefix penomoran Job File.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left shadow-sm">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      URL Ruang Kerja Subdomain Anda:
                    </span>
                    <a
                      href={registrationResult.workspaceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base sm:text-lg font-mono font-extrabold text-blue-600 hover:text-blue-800 break-all flex items-center gap-1.5 mt-1"
                    >
                      <span>{registrationResult.workspaceUrl}</span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-blue-500" />
                    </a>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={registrationResult.workspaceUrl}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
                    >
                      <span>Buka Konsol Operasional</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <Link
                      href="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Halaman Login
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
                      Gateway Pembayaran Otomatis BorderPay
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Scan QRIS untuk Aktivasi Paket
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Sistem webhook akan langsung mengaktifkan langganan Anda begitu pembayaran terverifikasi.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-sm mx-auto text-center space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-600">Total Pembayaran:</span>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        Rp {registrationResult.paymentDetails?.amount.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-md inline-block mx-auto">
                      {qrDataUrl ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={qrDataUrl}
                            alt="QRIS BorderPay Dynamic"
                            className="w-52 h-52 object-contain rounded-lg"
                          />
                          <div className="mt-2 text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>QRIS ASPI · BorderPay Gateway</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-52 w-52 bg-slate-50 flex flex-col items-center justify-center text-slate-400 rounded-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                          <span className="text-xs font-semibold">Menghasilkan Barcode QRIS...</span>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Ref: {registrationResult.paymentDetails?.referenceId}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isSimulatingPayment}
                        onClick={handleSimulateBorderPayWebhook}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors shadow-sm"
                      >
                        {isSimulatingPayment ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Memverifikasi Callback BorderPay...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                            <span>Simulasikan Pembayaran QRIS Sukses</span>
                          </>
                        )}
                      </button>
                      <span className="text-[10px] text-slate-400 block mt-1.5">
                        (Memicu webhook /api/webhooks/borderpay secara instan)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Security Note */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-blue-200/60">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            Enkripsi 256-bit SSL Terjamin
          </span>
          <span>•</span>
          <span>Isolasi Database PostgreSQL Multi-Tenant</span>
          <span>•</span>
          <span>
            Dioperasikan oleh <strong>PT. Rafa Kreasindo Teknologi</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
