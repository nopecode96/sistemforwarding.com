'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export function AboutContent() {
  const { lang } = useLanguage();
  const t = translations[lang].about;

  return (
    <div className="font-sans text-slate-800 bg-white selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <PublicHeader />

      {/* ══════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm font-semibold text-cyan-300 mb-6">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            {t.hero.badge}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            {t.hero.title} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {t.hero.titleHighlight}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
            {t.hero.subtitle}
          </p>

          {/* Highlights row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {t.hero.stats.map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-2xl md:text-3xl font-black text-cyan-300">{stat.val}</p>
                <p className="text-xs text-blue-200/70 mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12">
            <path d="M0,60 C360,10 1080,10 1440,60 L1440,60 L0,60 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LEGAL ENTITY & EEAT TRUST SECTION
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 md:p-14 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold block mb-2">
                  {t.legalSection.overline}
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-5 text-white">
                  {t.legalSection.companyName}
                </h2>
                <p className="text-slate-300 text-base leading-relaxed mb-8">
                  {t.legalSection.description}
                </p>

                <div className="space-y-4 text-sm text-slate-300">
                  {t.legalSection.checks.map((check, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </span>
                      <span>
                        <strong>{check.bold}</strong>
                        {check.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-7 border border-white/10 space-y-5">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center justify-between">
                  <span>{t.legalSection.boxTitle}</span>
                  <span className="text-xs text-emerald-400 font-normal flex items-center gap-1">
                    ● {t.legalSection.verified}
                  </span>
                </h3>
                <div className="space-y-3.5 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      {t.legalSection.fields.companyName}
                    </span>
                    <strong className="text-white text-sm">PT. Rafa Kreasindo Teknologi</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      {t.legalSection.fields.mainProduct}
                    </span>
                    <strong className="text-cyan-300 font-mono text-sm">sistemforwarding.com</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      {t.legalSection.fields.services}
                    </span>
                    <span className="text-white">
                      {t.legalSection.fields.servicesVal}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      {t.legalSection.fields.securityStandards}
                    </span>
                    <span className="text-white">
                      {t.legalSection.fields.securityStandardsVal}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/onboarding?plan=trial"
                      className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-xl transition-all shadow-lg"
                    >
                      {t.legalSection.fields.cta}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3 PILAR ARSITEKTUR
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-3">
              {t.pillars.badge}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              {t.pillars.title}
            </h2>
            <p className="text-base text-slate-500 max-w-2xl mx-auto">
              {t.pillars.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.pillars.items.map((pillar, i) => {
              const borderColors = ['hover:border-blue-300', 'hover:border-cyan-300', 'hover:border-indigo-300'];
              const bgColors = ['bg-blue-50 text-blue-600', 'bg-cyan-50 text-cyan-600', 'bg-indigo-50 text-indigo-600'];
              return (
                <div
                  key={pillar.title}
                  className={`bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-100 ${borderColors[i % 3]} transition-all`}
                >
                  <div className={`w-14 h-14 rounded-2xl ${bgColors[i % 3]} flex items-center justify-center text-3xl mb-6`}>
                    {pillar.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="relative py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            {t.ctaBanner.title}
          </h2>
          <p className="text-lg text-blue-100/90 mb-8 max-w-xl mx-auto">
            {t.ctaBanner.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/onboarding?plan=trial"
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl shadow-xl hover:bg-blue-50 transition-all transform hover:-translate-y-0.5"
            >
              {t.ctaBanner.ctaTrial}
            </Link>
            <Link
              href="/blog"
              className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 backdrop-blur-sm transition-all"
            >
              {t.ctaBanner.ctaEducation}
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
