'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/lib/articles';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

interface ArticleDetailContentProps {
  article: Article;
  relatedArticles: Article[];
}

export function ArticleDetailContent({ article, relatedArticles }: ArticleDetailContentProps) {
  const { lang } = useLanguage();
  const t = translations[lang].education;

  return (
    <div className="font-sans text-slate-800 bg-white selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <PublicHeader />

      {/* ══════════════════════════════════════════
          ARTICLE HERO BANNER
      ══════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 text-left">
              {/* Breadcrumb Navigation */}
              <nav className="flex items-center gap-2 text-xs font-semibold text-blue-200/70 mb-6">
                <Link href="/" className="hover:text-white transition-colors">
                  {t.detail.breadcrumbHome}
                </Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-white transition-colors">
                  {t.detail.breadcrumbEducation}
                </Link>
                <span>/</span>
                <span className="text-cyan-300 font-bold">{article.category}</span>
              </nav>

              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-bold text-cyan-300 mb-6 shadow-xs">
                <span className="text-sm">{article.icon}</span>
                <span>{article.category}</span>
              </div>

              {/* Article Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] mb-8 text-white">
                {article.title}
              </h1>

              {/* Author & Publication Meta */}
              <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-white/15 text-xs sm:text-sm text-blue-100/90">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black text-base flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                    {article.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{article.author}</p>
                    <p className="text-xs text-blue-200/70">{article.authorRole}</p>
                  </div>
                </div>
                <div className="hidden sm:block text-blue-300/40">•</div>
                <div className="flex items-center gap-4 text-xs text-blue-200/80">
                  <span>📅 {article.date}</span>
                  <span>⏱️ {article.readTime}</span>
                </div>
              </div>
            </div>

            {/* Right Hero Cover (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl aspect-[16/10] bg-slate-900 group">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
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
          ARTICLE BODY & CONTENT
      ══════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Main Article Content (8 cols) */}
          <div className="lg:col-span-8 space-y-10 text-slate-700">
            {/* Intro Lead Paragraph */}
            <div className="p-8 rounded-3xl bg-blue-50/60 border border-blue-100 text-base md:text-lg text-slate-800 leading-relaxed font-medium">
              {article.content.intro}
            </div>

            {/* Section Iterations */}
            {article.content.sections.map((section, idx) => (
              <section key={idx} className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">
                  {section.heading}
                </h2>
                {section.body.map((p, pIdx) => (
                  <p key={pIdx} className="text-base text-slate-600 leading-relaxed">
                    {p}
                  </p>
                ))}
                {section.callout && (
                  <div className="my-6 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-l-4 border-amber-500 text-sm text-slate-800 italic">
                    💡 {section.callout}
                  </div>
                )}
              </section>
            ))}

            {/* Key Takeaways Box */}
            {article.content.takeaways && article.content.takeaways.length > 0 && (
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl space-y-5">
                <h3 className="text-xl md:text-2xl font-black text-cyan-300 flex items-center gap-2">
                  <span>📌</span>
                  <span>{lang === 'en' ? 'Key Takeaways & Summary' : 'Poin Kunci & Kesimpulan'}</span>
                </h3>
                <ul className="space-y-3 text-sm text-slate-200">
                  {article.content.takeaways.map((item, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/blog"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-xs"
              >
                <span>{lang === 'en' ? '← Back to All Articles' : '← Kembali ke Semua Artikel'}</span>
              </Link>
              <Link
                href="/onboarding?plan=trial"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25"
              >
                <span>{lang === 'en' ? 'Try Sistem Forwarding Free' : 'Coba Sistem Forwarding Gratis'}</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Sticky Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-8 sticky top-28">
            {/* Quick Summary / CTA Box */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-7 rounded-3xl shadow-xl border border-slate-800 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
                {lang === 'en' ? 'Real Forwarding Solution' : 'Solusi Nyata Forwarding'}
              </span>
              <h3 className="text-xl font-bold leading-snug">
                {lang === 'en' ? 'Boost Office Job File Efficiency' : 'Tingkatkan Efisiensi Job File Kantor Anda'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? 'Leave manual spreadsheets behind. Sistem Forwarding automates cargo document sequencing, 1.1% VAT calculation, and invoicing instantly.'
                  : 'Tinggalkan pencatatan manual. Sistem Forwarding mengotomasikan penomoran dokumen kargo, perhitungan PPN 1.1%, dan invoicing secara instan.'}
              </p>
              <div className="pt-2">
                <Link
                  href="/onboarding?plan=trial"
                  className="block w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-600 text-slate-950 font-extrabold text-xs text-center rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
                >
                  {lang === 'en' ? 'Start 7-Day Free Trial 🚀' : 'Daftar Trial 7 Hari Sekarang 🚀'}
                </Link>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  {lang === 'en' ? 'No credit card · Instant 2-minute setup' : 'Tanpa kartu kredit · Setup instan 2 menit'}
                </p>
              </div>
            </div>

            {/* Badan Hukum Badge */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t.detail.publisherBadge}
              </p>
              <h4 className="text-sm font-bold text-slate-900">
                PT. Rafa Kreasindo Teknologi
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t.detail.publisherDesc}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════
          RELATED ARTICLES SECTION
      ══════════════════════════════════════════ */}
      {relatedArticles.length > 0 && (
        <section className="py-16 bg-slate-50 border-t border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-8">
              {t.detail.relatedArticlesTitle}
            </h3>
            <div className="grid sm:grid-cols-2 gap-8">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
                    <Image
                      src={rel.coverImage}
                      alt={rel.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-700 shadow-xs">
                      {rel.category}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-snug">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {rel.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">⏱️ {rel.readTime}</span>
                      <span className="font-bold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        <span>{t.readArticle}</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <PublicFooter />
    </div>
  );
}
