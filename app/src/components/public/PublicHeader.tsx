'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  LogIn,
  Sparkles,
  ArrowRight,
  Layers,
  Compass,
  Tag,
  BookOpen,
  Building2,
  MessageSquare,
  Globe,
  Gift,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

const WA_URL =
  'https://wa.me/6281122823696?text=Halo%20Customer%20Service%20Sistem%20Forwarding,%20saya%20ingin%20konsultasi%20seputar%20software%20kargo%20%26%20freight%20forwarding.';

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const t = translations[lang].header;

  const primaryLinks = [
    {
      href: '/#siapa-yang-membutuhkan',
      label: t.nav.solutions,
      icon: Building2,
    },
    {
      href: '/#fitur',
      label: t.nav.features,
      icon: Layers,
    },
    {
      href: '/#harga',
      label: t.nav.pricing,
      icon: Tag,
    },
    {
      href: '/#live-demo',
      label: t.nav.liveDemo,
      icon: Sparkles,
      badge: 'Live',
    },
  ];

  const moreLinks = [
    {
      href: '/#cara-kerja',
      label: t.nav.howItWorks,
      desc: t.nav.howItWorksDesc,
      icon: Compass,
    },
    {
      href: '/affiliate',
      label: t.nav.affiliate,
      desc: t.nav.affiliateDesc,
      icon: Gift,
      badge: '20%',
    },
    {
      href: '/blog',
      label: t.nav.education,
      desc: t.nav.educationDesc,
      icon: BookOpen,
    },
    {
      href: '/about',
      label: t.nav.aboutUs,
      desc: t.nav.aboutUsDesc,
      icon: Building2,
    },
  ];

  const mobileSections = [
    {
      title: lang === 'en' ? 'Solutions & Products' : 'Solusi & Produk',
      links: primaryLinks,
    },
    {
      title: lang === 'en' ? 'Company & Resources' : 'Perusahaan & Kemitraan',
      links: moreLinks,
    },
  ];

  // Close menus on route change
  useEffect(() => {
    setIsOpen(false);
    setIsMoreOpen(false);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOpen]);

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between bg-white/90 backdrop-blur-xl border border-white/70 rounded-2xl px-4 sm:px-6 h-16 shadow-lg shadow-slate-900/5 transition-all">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center shrink-0 pr-2"
              onClick={() => {
                setIsOpen(false);
                setIsMoreOpen(false);
              }}
            >
              <Image
                src="/logo.png"
                alt="Sistem Forwarding"
                width={170}
                height={40}
                className="h-8 sm:h-9 w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop Nav Links (Visible on lg and larger) */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-semibold text-slate-600">
              {primaryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors flex items-center gap-1.5 whitespace-nowrap py-1 ${
                    item.badge
                      ? 'text-blue-600 font-bold hover:text-blue-700'
                      : 'hover:text-blue-600'
                  }`}
                >
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                  )}
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              ))}

              {/* Dropdown Menu for Secondary / Company Links */}
              <div ref={moreRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsMoreOpen((v) => !v)}
                  className={`transition-colors flex items-center gap-1 py-1 whitespace-nowrap focus:outline-none ${
                    isMoreOpen
                      ? 'text-blue-600 font-bold'
                      : 'hover:text-blue-600 text-slate-600'
                  }`}
                  aria-expanded={isMoreOpen}
                  aria-label={t.nav.more}
                >
                  <span>{t.nav.more}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMoreOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'
                    }`}
                  />
                </button>

                {isMoreOpen && (
                  <div className="absolute top-full right-0 lg:left-1/2 lg:-translate-x-1/2 mt-2 w-72 sm:w-80 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl p-2 shadow-2xl shadow-slate-900/15 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="space-y-1">
                      {moreLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMoreOpen(false)}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors mt-0.5 shadow-2xs">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Language Switcher Pill (Desktop) */}
              <div className="hidden sm:flex items-center bg-slate-100/90 rounded-xl p-0.5 border border-slate-200/80 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setLang('id')}
                  className={`px-2 py-1 rounded-lg transition-all whitespace-nowrap ${
                    lang === 'id'
                      ? 'bg-white text-blue-700 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Bahasa Indonesia"
                  aria-label="Ganti ke Bahasa Indonesia"
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2 py-1 rounded-lg transition-all whitespace-nowrap ${
                    lang === 'en'
                      ? 'bg-white text-blue-700 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="English"
                  aria-label="Switch to English"
                >
                  EN
                </button>
              </div>

              {/* WhatsApp Button (Desktop - Visible on xl and up) */}
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs shrink-0 whitespace-nowrap"
                title={t.waTitle}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="whitespace-nowrap">{t.waButton}</span>
              </a>

              {/* Login Link (Desktop) */}
              <Link
                href="/login"
                className="hidden lg:block text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2 py-1 shrink-0 whitespace-nowrap"
              >
                {t.login}
              </Link>

              {/* Coba Gratis CTA (All Viewports) */}
              <Link
                href="/onboarding?plan=trial"
                className="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all transform hover:-translate-y-px shrink-0 whitespace-nowrap"
              >
                <span>{t.tryFree}</span>
                <span className="hidden sm:inline"> →</span>
              </Link>

              {/* Mobile & Tablet Hamburger Button (Visible on < lg) */}
              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0"
                aria-expanded={isOpen}
                aria-label={isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile & Tablet Dropdown Menu Card */}
          {isOpen && (
            <div className="lg:hidden mt-2">
              <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-slate-900/20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                {/* Language Switcher in Mobile Drawer */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.languageLabel}</span>
                  </div>
                  <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 text-xs font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setLang('id')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        lang === 'id'
                          ? 'bg-blue-600 text-white shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🇮🇩 ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        lang === 'en'
                          ? 'bg-blue-600 text-white shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🇬🇧 EN
                    </button>
                  </div>
                </div>

                {/* Categorized Navigation Sections */}
                <div className="space-y-4">
                  {mobileSections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                        {section.title}
                      </p>
                      {section.links.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100/80 text-slate-600 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="whitespace-nowrap">{item.label}</span>
                            </div>
                            {item.badge ? (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {item.badge}
                              </span>
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 my-3" />

                {/* WhatsApp Customer Service Card */}
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-200/80 hover:border-emerald-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t.mobileWaTitle}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {t.mobileWaSub}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                </a>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4 text-slate-500" />
                    <span>{t.login}</span>
                  </Link>
                  <Link
                    href="/onboarding?plan=trial"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all whitespace-nowrap"
                  >
                    <span>{t.tryFree}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Backdrop overlay for Mobile & Tablet when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
