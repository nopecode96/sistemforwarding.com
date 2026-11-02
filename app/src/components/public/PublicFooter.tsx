'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export function PublicFooter() {
  const { lang, setLang } = useLanguage();
  const t = translations[lang].footer;

  return (
    <footer className="bg-slate-950 text-slate-400 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Kemitraan & Affiliate Program Offer Box */}
        <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/60 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="relative z-10 flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-1 sm:mt-0 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                {t.affiliateBanner?.badge || 'Peluang Kemitraan B2B'}
              </div>
              <h3 className="text-white font-extrabold text-base sm:text-lg tracking-tight">
                {t.affiliateBanner?.title || 'Dapatkan Komisi Recurring 20% dari Program Afiliasi'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                {t.affiliateBanner?.desc || 'Rekomendasikan sistemforwarding.com ke relasi logistik Anda (forwarder, staf PPJK, konsultan pajak, agen asuransi). Hasilkan komisi hingga Rp 2.000.000 per klien.'}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/affiliate"
              className="px-5 py-3 rounded-xl font-bold text-xs bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20"
            >
              <span>{t.affiliateBanner?.cta || 'Pelajari Program & Daftar'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/affiliate/login"
              className="px-4 py-3 rounded-xl font-semibold text-xs text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white transition-all text-center"
            >
              Portal Mitra
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-12 pb-16 border-b border-slate-800">
          {/* Brand col */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Sistem Forwarding Logo"
                width={180}
                height={50}
                className="h-12 w-auto mb-6 brightness-0 invert opacity-80"
              />
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm mb-6 text-sm">
              {t.tagline}
            </p>
            {/* Legal badge */}
            <div className="inline-block bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4">
              <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">
                {t.legalBadgeTitle}
              </p>
              <p className="text-white font-bold text-sm">{t.legalBadgeCompany}</p>
              <p className="text-xs text-slate-500 mt-1">© {new Date().getFullYear()} {t.copyright}</p>
            </div>
          </div>

          {/* Links: Produk */}
          <div className="md:col-span-2 md:col-start-7">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">
              {t.colProduct}
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: 'https://demo1.sistemforwarding.com', label: 'Demo 1 (PT. Demo 1)' },
                { href: 'https://demo2.sistemforwarding.com', label: 'Demo 2 (PT. Demo 2)' },
                { href: '/#fitur', label: t.links.operationalFeatures },
                { href: '/#live-demo', label: t.links.liveDemoPortals },
                { href: '/#harga', label: t.links.pricingPlans },
                { href: '/#cara-kerja', label: t.links.howItWorks },
                { href: '/onboarding?plan=trial', label: t.links.freeTrial },
              ].map((l) => (
                <li key={l.label}>
                  {l.href.startsWith('http') ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      <span>{l.label}</span>
                    </a>
                  ) : (
                    <Link href={l.href} className="hover:text-blue-400 transition-colors">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Perusahaan */}
          <div className="md:col-span-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">
              {t.colCompany}
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/about', label: t.links.aboutUs },
                {
                  href: '/affiliate',
                  label: t.links.affiliateProgram || 'Program Afiliasi B2B',
                  highlight: true,
                },
                {
                  href: '/affiliate/login',
                  label: t.links.affiliatePortal || 'Login Portal Afiliasi',
                },
                { href: '/blog', label: t.links.articlesEducation },
                {
                  href: 'https://wa.me/6281122823696?text=Halo%20Customer%20Service%20Sistem%20Forwarding,%20saya%20ingin%20konsultasi%20software%20freight%20forwarding.',
                  label: t.links.waCs,
                  isExternal: true,
                },
                { href: '/about', label: t.links.contactUs },
              ].map((l) => (
                <li key={l.label}>
                  {l.isExternal ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{l.label}</span>
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className={
                        l.highlight
                          ? 'text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1.5'
                          : 'hover:text-blue-400 transition-colors'
                      }
                    >
                      {l.highlight && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>}
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Legal */}
          <div className="md:col-span-2">
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">
              {t.colLegal}
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/terms', label: t.links.terms },
                { href: '/privacy', label: t.links.privacy },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-blue-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} <strong className="text-slate-400">sistemforwarding.com</strong> — {t.operatedBy}{' '}
            <strong className="text-slate-400">PT. Rafa Kreasindo Teknologi</strong>
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              {t.links.termsOfService}
            </Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              {t.links.privacyShort}
            </Link>
            {/* Quick Language Toggle in footer */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLang('id')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  lang === 'id' ? 'bg-slate-700 text-white font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  lang === 'en' ? 'bg-slate-700 text-white font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
