'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { PlanItem } from '@/actions/planActions';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

// ─── Check Icon ────────────────────────────────────────────────────────────────
function CheckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const EN_FEATURE_MAP: Record<string, string> = {
  "Manajemen Job File Kargo": "Cargo Job File Management",
  "Invoicing & Tagihan Otomatis": "Automated Invoicing & Billing",
  "Kalkulasi PPN 1.1%": "1.1% Logistics VAT Calculation",
  "Cetak AWB, HBL & DO": "Print AWB, HBL & DO Documents",
  "Tracking Kargo Real-time": "Real-time Cargo Tracking",
  "Multi-User & Hak Akses": "Multi-User & Role Permissions",
  "Laporan Laba/Rugi Bulanan": "Monthly P&L Reports",
  "Integrasi API & Support Khusus": "API Integration & Dedicated Support",
  "Hingga 50 Job File / bulan": "Up to 50 Job Files / month",
  "Hingga 200 Job File / bulan": "Up to 200 Job Files / month",
  "Unlimited Job File": "Unlimited Job Files",
  "Backup Harian Otomatis": "Automated Daily Backups",
  "Subdomain Eksklusif": "Exclusive Subdomain",
  "Support WhatsApp CS": "WhatsApp CS Priority Support",
};

interface LandingPageContentProps {
  plans: PlanItem[];
}

export function LandingPageContent({ plans }: LandingPageContentProps) {
  const { lang } = useLanguage();
  const t = translations[lang].home;

  const formatPeriod = (period: string) => {
    if (lang === 'en') {
      return period
        .replace('/ bulan', '/ month')
        .replace('/ tahun', '/ year')
        .replace('7 Hari', '7 Days');
    }
    return period;
  };

  const translateFeature = (feature: string) => {
    if (lang === 'en') {
      return EN_FEATURE_MAP[feature] || feature;
    }
    return feature;
  };

  return (
    <div className="font-sans text-slate-800 overflow-x-hidden selection:bg-blue-200">
      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <PublicHeader />

      {/* ══════════════════════════════════════════
          HERO — FULLSCREEN SPLIT
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-blue-500 rounded-full opacity-10 blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400 rounded-full opacity-10 blur-3xl translate-y-1/4 -translate-x-1/4 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-indigo-500 rounded-full opacity-15 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* LEFT: Copy */}
            <div className="text-white">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm font-semibold text-cyan-300 mb-8">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                {t.hero.badge}
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight mb-5">
                {t.hero.titleLine1}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  {t.hero.titleLine2}
                </span>
                <br />
                {t.hero.titleLine3}
              </h1>

              {/* Sub */}
              <p className="text-lg md:text-xl text-blue-100/80 leading-relaxed max-w-lg mb-10">
                {t.hero.subtitle}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Link
                  href="/onboarding?plan=trial"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 text-base font-bold rounded-xl shadow-2xl shadow-black/20 hover:bg-blue-50 transition-all transform hover:-translate-y-0.5 hover:shadow-white/20"
                >
                  {t.hero.ctaTrial}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                <a
                  href="#live-demo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white text-base font-semibold rounded-xl hover:bg-white/15 backdrop-blur-sm transition-all"
                >
                  <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t.hero.ctaDemo}
                </a>
              </div>

              {/* Direct Demo Quick Launcher */}
              <div className="flex flex-wrap items-center gap-2.5 mb-10 text-xs">
                <span className="text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                  {t.hero.directLauncherLabel}
                </span>
                <a
                  href="https://demo1.sistemforwarding.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-blue-500/30 border border-white/20 hover:border-blue-400 text-white font-semibold transition-all group"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-cyan-300 transition-colors"></span>
                  <span>Demo 1 (PT. Demo 1) &rarr;</span>
                </a>
                <a
                  href="https://demo2.sistemforwarding.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-indigo-500/30 border border-white/20 hover:border-indigo-400 text-white font-semibold transition-all group"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-400 group-hover:bg-purple-300 transition-colors"></span>
                  <span>Demo 2 (PT. Demo 2) &rarr;</span>
                </a>
              </div>

              {/* Stats bar */}
              <div className="flex flex-wrap gap-8">
                {t.hero.stats.map((s) => (
                  <div key={s.num} className="text-center sm:text-left">
                    <p className="text-3xl font-extrabold text-white">{s.num}</p>
                    <p className="text-sm text-blue-200/70 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Responsive Dashboard Device Mockup */}
            <div className="relative w-full flex items-center justify-center lg:justify-end mt-8 lg:mt-0">
              {/* Vibrant radial glow backdrop */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/25 via-blue-500/30 to-indigo-500/25 rounded-full blur-3xl scale-95 pointer-events-none" />

              {/* Floating badges */}
              <div className="hidden sm:flex absolute -top-4 -left-2 sm:-left-4 z-20 items-center gap-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl px-4 py-3 border border-white/60 transform hover:-translate-y-1 transition-transform">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    {t.hero.mockupNewJob}
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 font-mono">SF-20261031-084</p>
                </div>
              </div>

              <div className="hidden sm:flex absolute -bottom-3 -right-2 sm:right-2 z-20 items-center gap-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl px-4 py-3 border border-white/60 transform hover:-translate-y-1 transition-transform">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-black text-base shadow-xs">
                  ✓
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    {t.hero.mockupPaidInvoice}
                  </p>
                  <p className="text-sm font-extrabold text-emerald-600 font-mono">+Rp 24.000.000</p>
                </div>
              </div>

              {/* Responsive Device Mockup Image */}
              <div className="relative z-10 w-full max-w-[580px] lg:max-w-none flex items-center justify-center group">
                <Image
                  src="/hero-mockup.png"
                  alt="Dashboard Operasional Sistem Forwarding"
                  width={1006}
                  height={628}
                  priority
                  className="w-full h-auto object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.5)] transform group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 85vw, 600px"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20">
            <path d="M0,80 C360,20 1080,20 1440,80 L1440,80 L0,80 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TRUST BAR
      ══════════════════════════════════════════ */}
      <section className="bg-slate-50 py-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
            {t.trustBar.title}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4">
            {['PT. Maju Logistics', 'CV. Nusantara Cargo', 'PT. Indo Express', 'PT. Trans Global Freight', 'PT. Samudra Jaya'].map((name) => (
              <span key={name} className="text-sm font-bold text-slate-300 tracking-wide uppercase">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LIVE DEMO SHOWCASE
      ══════════════════════════════════════════ */}
      <section id="live-demo" className="py-24 bg-gradient-to-b from-slate-50 to-white border-b border-slate-150 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-200/70">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              {t.demo.badge}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              {t.demo.title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {t.demo.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Demo 1 Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-blue-400 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    D1
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold uppercase tracking-wide">
                    {t.demo.demo1.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  {t.demo.demo1.title}
                </h3>
                <p className="text-xs font-mono font-bold text-blue-600 mt-1 mb-4">
                  {t.demo.demo1.url}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {t.demo.demo1.desc}
                </p>

                <div className="space-y-2 mb-8 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">{t.demo.demo1.emailLabel}</span>
                    <strong className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      demo1@sistemforwarding.com
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">{t.demo.demo1.passwordLabel}</span>
                    <span className="font-mono text-slate-800">{t.demo.demo1.passwordNote}</span>
                  </div>
                </div>
              </div>

              <a
                href="https://demo1.sistemforwarding.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all transform group-hover:-translate-y-0.5"
              >
                <span>{t.demo.demo1.cta}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            {/* Demo 2 Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-indigo-400 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    D2
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold uppercase tracking-wide">
                    {t.demo.demo2.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {t.demo.demo2.title}
                </h3>
                <p className="text-xs font-mono font-bold text-indigo-600 mt-1 mb-4">
                  {t.demo.demo2.url}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {t.demo.demo2.desc}
                </p>

                <div className="space-y-2 mb-8 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">{t.demo.demo2.emailLabel}</span>
                    <strong className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      demo2@sistemforwarding.com
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">{t.demo.demo2.passwordLabel}</span>
                    <span className="font-mono text-slate-800">{t.demo.demo2.passwordNote}</span>
                  </div>
                </div>
              </div>

              <a
                href="https://demo2.sistemforwarding.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all transform group-hover:-translate-y-0.5"
              >
                <span>{t.demo.demo2.cta}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DIRANCANG UNTUK SIAPA? — Target Ekosistem
      ══════════════════════════════════════════ */}
      <section id="siapa-yang-membutuhkan" className="py-24 bg-slate-50 border-b border-slate-150 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold mb-4 border border-indigo-100">
              {t.whoIsItFor?.badge || "Target Industri & Ekosistem"}
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">
              {t.whoIsItFor?.title || "Dirancang Khusus untuk"}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                {" "}{t.whoIsItFor?.titleHighlight || "Siapa Saja?"}
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              {t.whoIsItFor?.subtitle || "Satu platform cloud autopilot yang fleksibel, melayani seluruh spektrum pelaku usaha logistik, transportasi, dan kepabeanan di Indonesia."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.whoIsItFor?.profiles?.map((profile: any, idx: number) => {
              const borderColors = [
                "hover:border-blue-500/50 hover:shadow-blue-500/10",
                "hover:border-purple-500/50 hover:shadow-purple-500/10",
                "hover:border-amber-500/50 hover:shadow-amber-500/10",
                "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
                "hover:border-cyan-500/50 hover:shadow-cyan-500/10",
                "hover:border-indigo-500/50 hover:shadow-indigo-500/10",
              ];
              const tagColors = [
                "bg-blue-50 text-blue-700 border-blue-200/60",
                "bg-purple-50 text-purple-700 border-purple-200/60",
                "bg-amber-50 text-amber-700 border-amber-200/60",
                "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                "bg-cyan-50 text-cyan-700 border-cyan-200/60",
                "bg-indigo-50 text-indigo-700 border-indigo-200/60",
              ];

              return (
                <div
                  key={profile.title}
                  className={`bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${borderColors[idx % borderColors.length]} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shadow-xs">
                        {profile.icon}
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tagColors[idx % tagColors.length]}`}>
                        {profile.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {profile.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                      {profile.desc}
                    </p>
                  </div>

                  <div className="pt-5 border-t border-slate-100 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Kapabilitas Unggulan:
                    </span>
                    {profile.features.map((feat: string) => (
                      <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                        <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FITUR — Alternating Layout
      ══════════════════════════════════════════ */}
      <section id="fitur" className="py-28 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-4">
              {t.features.badge}
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">
              {t.features.title}
              <br className="hidden md:block" />
              <span className="text-blue-600"> {t.features.titleHighlight}</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          {t.features.items.map((feat, i) => {
            const icons = ['📦', '🧾', '🏢'];
            const accents = [
              'from-blue-500 to-blue-600',
              'from-cyan-500 to-blue-500',
              'from-indigo-500 to-purple-600',
            ];
            const backgrounds = [
              'from-blue-50 to-indigo-50',
              'from-cyan-50 to-blue-50',
              'from-indigo-50 to-purple-50',
            ];
            const reverse = i === 1;

            return (
              <div
                key={feat.title}
                className={`flex flex-col ${
                  reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } items-center gap-12 lg:gap-20 mb-28 last:mb-0`}
              >
                {/* Visual panel */}
                <div
                  className={`w-full lg:w-1/2 rounded-3xl bg-gradient-to-br ${backgrounds[i]} p-10 flex items-center justify-center min-h-80 border border-slate-100 shadow-xl shadow-slate-100`}
                >
                  <div className="text-center">
                    <div className="w-28 h-28 rounded-3xl bg-white shadow-xl flex items-center justify-center text-6xl mb-6 mx-auto">
                      {icons[i]}
                    </div>
                    <div
                      className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${accents[i]} text-white text-sm font-bold shadow-lg`}
                    >
                      {feat.tag}
                    </div>
                  </div>
                </div>
                {/* Text */}
                <div className="w-full lg:w-1/2">
                  <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">
                    {feat.tag}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-5 leading-tight">
                    {feat.title}
                  </h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">{feat.body}</p>
                  <ul className="space-y-4">
                    {feat.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r ${accents[i]} flex items-center justify-center`}
                        >
                          <CheckIcon className="text-white w-3.5 h-3.5" />
                        </span>
                        <span className="text-slate-700 font-medium">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CARA KERJA — 3 Steps
      ══════════════════════════════════════════ */}
      <section id="cara-kerja" className="py-28 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden scroll-mt-24">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold mb-4 border border-cyan-400/20 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            {t.howItWorks.badge}
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            {t.howItWorks.title}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
              {t.howItWorks.titleHighlight}
            </span>
          </h2>
          <p className="text-base md:text-lg text-blue-100/70 max-w-2xl mx-auto mb-16 leading-relaxed">
            {t.howItWorks.subtitle}
          </p>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-20 left-[18%] right-[18%] h-0.5 bg-gradient-to-r from-cyan-500/20 via-cyan-400/60 to-blue-500/20 pointer-events-none" />

            {t.howItWorks.steps.map((s, i) => {
              const gradients = [
                'from-cyan-400 to-blue-500',
                'from-blue-500 to-indigo-500',
                'from-indigo-500 to-purple-500',
              ];
              return (
                <div
                  key={i}
                  className="group relative flex flex-col items-center text-center p-8 sm:p-9 rounded-3xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-400/50 backdrop-blur-xl shadow-xl hover:shadow-[0_15px_40px_rgba(6,182,212,0.15)] transition-all duration-500 transform hover:-translate-y-2"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${gradients[i]} flex items-center justify-center text-white font-black text-xl mb-6 shadow-xl shadow-cyan-500/20 ring-4 ring-white/10 group-hover:ring-cyan-400/40 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300`}
                  >
                    {s.step}
                  </div>

                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {s.icon}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                    {s.title}
                  </h3>

                  <p className="text-sm text-blue-100/70 leading-relaxed mb-6 flex-1">{s.desc}</p>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4 border-t border-slate-800/80 w-full">
                    {s.pills.map((pill) => (
                      <span
                        key={pill}
                        className="text-[11px] font-semibold text-cyan-200/90 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-1 rounded-lg"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/onboarding?plan=trial"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-blue-600 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span>{t.howItWorks.cta}</span>
              <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIAL
      ══════════════════════════════════════════ */}
      <section className="py-28 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-100 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-4">
            {t.testimonials.badge}
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-16">
            {t.testimonials.title}
            <br className="hidden md:block" />
            <span className="text-blue-600"> {t.testimonials.titleHighlight}</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {t.testimonials.items.map((testi, i) => {
              const colors = [
                'from-blue-500 to-blue-600',
                'from-cyan-500 to-blue-500',
                'from-indigo-500 to-purple-600',
              ];
              return (
                <div
                  key={testi.name}
                  className="bg-white rounded-3xl p-8 text-left shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <svg key={starIdx} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed flex-1 mb-6 text-base italic">{testi.quote}</p>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[i]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                    >
                      {testi.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{testi.name}</p>
                      <p className="text-sm text-slate-500">
                        {testi.role} · {testi.company}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section id="harga" className="py-20 lg:py-24 bg-slate-50/60 relative overflow-hidden scroll-mt-20">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wider uppercase mb-3">
              {t.pricing.badge}
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              {t.pricing.title}
              <br />
              <span className="text-blue-600">{t.pricing.titleHighlight}</span>
            </h2>
            <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto">
              {t.pricing.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-4 xl:gap-6 max-w-7xl mx-auto items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl flex flex-col justify-between transition-all duration-300 hover:shadow-2xl h-full ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-blue-600 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/25 ring-2 ring-blue-500 lg:-translate-y-2'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-md shadow-slate-100 hover:border-blue-300'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[11px] font-black px-3.5 py-1 rounded-full shadow-md uppercase tracking-wider whitespace-nowrap z-10 flex items-center gap-1">
                    <span>⭐</span> {t.pricing.popularBadge}
                  </div>
                )}

                {/* Card Content */}
                <div className="p-5 sm:p-6 xl:p-7 flex-1 flex flex-col">
                  <h3 className={`text-lg font-bold mb-1 ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>

                  <div className="min-h-6 flex items-center mb-2.5">
                    {plan.originalPrice && plan.originalPrice > plan.price ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`line-through text-xs font-mono font-medium ${plan.isPopular ? 'text-blue-200/90' : 'text-slate-400'}`}>
                          Rp {plan.originalPrice.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')}
                        </span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                          plan.isPopular ? 'bg-amber-400 text-slate-900 shadow-xs' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {t.pricing.discount} {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        plan.isPopular ? 'bg-blue-500/40 text-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {t.pricing.noCommitment}
                      </span>
                    )}
                  </div>

                  {/* Price & Period */}
                  <div className={`pb-4 mb-4 border-b ${plan.isPopular ? 'border-blue-400/30' : 'border-slate-100'}`}>
                    {plan.price === 0 ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-3xl xl:text-4xl font-extrabold tracking-tight ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>
                          {t.pricing.freePriceLabel}
                        </span>
                        <span className={`text-xs font-semibold ${plan.isPopular ? 'text-blue-200' : 'text-slate-500'}`}>
                          {t.pricing.per7Days}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xs sm:text-sm font-bold ${plan.isPopular ? 'text-blue-200' : 'text-slate-500'}`}>
                            Rp
                          </span>
                          <span className={`text-2xl sm:text-[26px] xl:text-[30px] font-black tracking-tight leading-none ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>
                            {plan.price.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')}
                          </span>
                        </div>
                        <span className={`text-xs font-semibold shrink-0 ${plan.isPopular ? 'text-blue-200' : 'text-slate-500'}`}>
                          {formatPeriod(plan.period.startsWith('/') ? plan.period : `/ ${plan.period}`)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feature Bullets */}
                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckIcon className={`w-4 h-4 shrink-0 mt-0.5 ${plan.isPopular ? 'text-cyan-300' : 'text-blue-600'}`} />
                        <span className={`text-xs xl:text-sm leading-relaxed ${plan.isPopular ? 'text-blue-100' : 'text-slate-600'}`}>
                          {translateFeature(f)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Button */}
                <div className="p-5 sm:p-6 xl:p-7 pt-0 mt-auto">
                  <Link
                    href={`/onboarding?plan=${plan.planKey || plan.id}`}
                    className={`block w-full py-3 text-center rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                      plan.isPopular
                        ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg shadow-black/10'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                    }`}
                  >
                    {plan.price === 0 ? t.pricing.ctaFree : t.pricing.ctaPaid}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs sm:text-sm text-slate-400 mt-10">
            {t.pricing.guaranteeNote}
          </p>

          {/* Customer Service WhatsApp Callout */}
          <div className="mt-12 max-w-4xl mx-auto bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900">
                  {t.pricing.csCard.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {t.pricing.csCard.desc}
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/6281122823696?text=Halo%20CS%20Sistem%20Forwarding,%20saya%20ingin%20konsultasi%20seputar%20software%20kargo%20dan%20penawaran%20harga%20custom."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2.5 whitespace-nowrap hover:scale-105 shrink-0"
            >
              <span>{t.pricing.csCard.cta}</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="relative py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full opacity-5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-cyan-400 rounded-full opacity-10 blur-2xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Image
            src="/logo.png"
            alt="Sistem Forwarding"
            width={160}
            height={48}
            className="h-12 w-auto mx-auto mb-8 brightness-0 invert opacity-90"
          />
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight whitespace-pre-line">
            {t.ctaBanner.headline}
          </h2>
          <p className="text-xl text-blue-100/80 mb-10 max-w-xl mx-auto">
            {t.ctaBanner.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/onboarding?plan=trial"
              className="px-10 py-5 bg-white text-blue-700 text-lg font-black rounded-2xl shadow-2xl shadow-black/20 hover:bg-blue-50 transition-all transform hover:-translate-y-0.5"
            >
              {t.ctaBanner.ctaTrial}
            </Link>
            <Link
              href="/about"
              className="px-10 py-5 bg-white/10 border border-white/20 text-white text-lg font-semibold rounded-2xl hover:bg-white/20 backdrop-blur-sm transition-all"
            >
              {t.ctaBanner.ctaAbout}
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <PublicFooter />
    </div>
  );
}
