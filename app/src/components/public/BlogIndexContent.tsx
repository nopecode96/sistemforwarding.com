'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Article } from '@/lib/articles';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

interface BlogIndexContentProps {
  articles: Article[];
}

export function BlogIndexContent({ articles }: BlogIndexContentProps) {
  const { lang } = useLanguage();
  const t = translations[lang].education;
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // Map category filter indices
  const categoryFilters = t.categories;

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
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12">
            <path d="M0,60 C360,10 1080,10 1440,60 L1440,60 L0,60 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CATEGORY FILTER CHIPS
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {categoryFilters.map((category, idx) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategoryIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                selectedCategoryIndex === idx
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ARTICLE GRID (Articles from DB)
      ══════════════════════════════════════════ */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-lg shadow-slate-100 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1.5"
            >
              {/* Cover Image Banner */}
              <div className="relative h-56 w-full bg-slate-900 overflow-hidden">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-blue-700 shadow-xs border border-white/40">
                    <span>{article.icon}</span>
                    <span>{article.category}</span>
                  </span>
                </div>
                <div className="absolute bottom-3 right-4">
                  <span className="text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md">
                    ⏱️ {article.readTime}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3 leading-snug">
                    {article.title}
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6 line-clamp-3">
                    {article.summary}
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{article.author}</p>
                    <p className="text-[11px] text-slate-400">{article.date}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-800 group-hover:translate-x-1 transition-all">
                    <span>{t.readArticle}</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EEAT BANNER
      ══════════════════════════════════════════ */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 border border-blue-200 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto shadow-xs">
          <span className="text-3xl mb-3 block">🚀</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-3">
            {t.eeatCard.title}
          </h3>
          <p className="text-sm text-slate-600 mb-8 max-w-xl mx-auto leading-relaxed">
            {t.eeatCard.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/onboarding?plan=trial"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <span>{t.eeatCard.ctaTrial}</span>
              <span>→</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            >
              {t.eeatCard.ctaAbout}
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
