import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getArticleBySlugFromDb, getArticlesFromDb } from '@/lib/articles';

export const dynamic = 'force-dynamic';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlugFromDb(slug);

  if (!article) {
    return {
      title: 'Artikel Tidak Ditemukan | Sistem Forwarding',
    };
  }

  return {
    title: `${article.title} | Sistem Forwarding`,
    description: article.summary,
    keywords: `${article.category}, sistem forwarding, freight forwarding indonesia, logistik, ${article.title.toLowerCase()}`,
    alternates: { canonical: `https://sistemforwarding.com/blog/${article.slug}` },
    openGraph: {
      title: `${article.title} | Sistem Forwarding`,
      description: article.summary,
      url: `https://sistemforwarding.com/blog/${article.slug}`,
      siteName: 'Sistem Forwarding',
      locale: 'id_ID',
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      images: [
        {
          url: article.coverImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlugFromDb(slug);

  if (!article) {
    notFound();
  }

  const allArticles = await getArticlesFromDb();
  const relatedArticles = allArticles.filter((a) => a.slug !== slug).slice(0, 2);

  return (
    <div className="font-sans text-slate-800 bg-white selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* ══════════════════════════════════════════
          NAVBAR (Consistent max-w-7xl)
      ══════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-6 h-16 shadow-lg shadow-slate-900/5">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Sistem Forwarding"
                width={180}
                height={44}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <Link href="/#fitur" className="hover:text-blue-600 transition-colors">Fitur</Link>
              <Link href="/#cara-kerja" className="hover:text-blue-600 transition-colors">Cara Kerja</Link>
              <Link href="/#harga" className="hover:text-blue-600 transition-colors">Harga</Link>
              <Link href="/blog" className="text-blue-600 font-bold transition-colors">Edukasi</Link>
              <Link href="/about" className="hover:text-blue-600 transition-colors">Tentang Kami</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden md:block text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                Masuk
              </Link>
              <Link
                href="/onboarding?plan=trial"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all transform hover:-translate-y-px"
              >
                Coba Gratis →
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          ARTICLE HERO BANNER (Aligned with Header max-w-7xl)
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
                <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-white transition-colors">Edukasi</Link>
                <span>/</span>
                <span className="text-cyan-300 font-bold">{article.category}</span>
              </nav>

              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-bold text-cyan-300 mb-6 shadow-sm">
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

            {/* Right Column: Featured Cover Image (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-[16/10] bg-slate-900 group">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-white/90">
                  <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 font-medium">
                    📷 Dokumentasi Kargo &amp; Operasional
                  </span>
                  <span className="bg-cyan-500/80 backdrop-blur-md text-slate-950 font-bold px-2 py-0.5 rounded text-[10px]">
                    HD Original
                  </span>
                </div>
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
          ARTICLE CONTENT & SIDEBAR (max-w-7xl)
      ══════════════════════════════════════════ */}
      <main className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Main Reading Column (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Executive Key Takeaways Box */}
            <div className="bg-gradient-to-br from-blue-50 via-cyan-50/40 to-indigo-50 border border-blue-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2.5 text-blue-900 font-extrabold text-lg mb-4">
                <span className="text-2xl">💡</span>
                <span>Poin Kunci &amp; Ringkasan Eksekutif</span>
              </div>
              <ul className="space-y-3.5">
                {article.content.takeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed font-medium">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-sm">
                      ✓
                    </span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Intro Lead Paragraph */}
            <div className="text-lg sm:text-xl text-slate-700 leading-relaxed font-medium pb-8 border-b border-slate-100">
              {article.content.intro}
            </div>

            {/* Content Sections */}
            <div className="space-y-12">
              {article.content.sections.map((section, idx) => (
                <section key={idx} className="space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {section.heading}
                  </h2>

                  <div className="space-y-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                    {section.body.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>

                  {section.callout && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/80 border-l-4 border-amber-500 text-amber-900 text-sm sm:text-base leading-relaxed my-6 font-medium shadow-sm">
                      {section.callout}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Author Credibility Card (EEAT Standard) */}
            <div className="mt-16 pt-8 border-t border-slate-200 bg-slate-50/70 rounded-3xl p-8 border">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                  {article.author.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{article.author}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Author Terverifikasi
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-blue-600 mb-2">{article.authorRole}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Artikel ini disusun dan diverifikasi oleh tim spesialis kargo dan kepatuhan finansial di bawah naungan <strong>PT. Rafa Kreasindo Teknologi</strong> untuk menjamin akurasi operasional dan kepatuhan regulasi logistik Indonesia.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/blog"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-sm"
              >
                <span>← Kembali ke Semua Artikel</span>
              </Link>
              <Link
                href="/onboarding?plan=trial"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25"
              >
                <span>Coba Sistem Forwarding Gratis</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Sticky Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-8 sticky top-28">
            {/* Quick Summary / CTA Box */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-7 rounded-3xl shadow-xl border border-slate-800 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
                Solusi Nyata Forwarding
              </span>
              <h3 className="text-xl font-bold leading-snug">
                Tingkatkan Efisiensi Job File Kantor Anda
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tinggalkan pencatatan manual. Sistem Forwarding mengotomasikan penomoran dokumen kargo, perhitungan PPN 1.1%, dan invoicing secara instan.
              </p>
              <div className="pt-2">
                <Link
                  href="/onboarding?plan=trial"
                  className="block w-full py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-600 text-slate-950 font-extrabold text-xs text-center rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Daftar Trial 7 Hari Sekarang 🚀
                </Link>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Tanpa kartu kredit · Setup instan 2 menit
                </p>
              </div>
            </div>

            {/* Badan Hukum Badge */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Penerbit &amp; Pengembang
              </p>
              <h4 className="text-sm font-bold text-slate-900">
                PT. Rafa Kreasindo Teknologi
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Penyedia platform SaaS TMS &amp; ERP B2B multi-tenant terpercaya untuk ekosistem logistik Indonesia.
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
              Artikel Edukasi Terkait
            </h3>
            <div className="grid sm:grid-cols-2 gap-8">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
                    <Image
                      src={rel.coverImage}
                      alt={rel.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-700 shadow-sm">
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
                        <span>Baca Artikel</span>
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
          FOOTER (Matching Homepage)
      ══════════════════════════════════════════ */}
      <footer className="bg-slate-950 text-slate-400 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-12 pb-16 border-b border-slate-800">
            <div className="md:col-span-5">
              <Image
                src="/logo.png"
                alt="Sistem Forwarding Logo"
                width={180}
                height={50}
                className="h-12 w-auto mb-6 brightness-0 invert opacity-80"
              />
              <p className="text-slate-400 leading-relaxed max-w-sm mb-6 text-sm">
                Platform ERP &amp; TMS berbasis web khusus untuk perusahaan freight forwarding Indonesia.
                Dari Job File hingga laporan laba/rugi — semua terpusat.
              </p>
              <div className="inline-block bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4">
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Badan Hukum</p>
                <p className="text-white font-bold text-sm">PT. Rafa Kreasindo Teknologi</p>
                <p className="text-xs text-slate-500 mt-1">© {new Date().getFullYear()} Hak Cipta Dilindungi</p>
              </div>
            </div>

            <div className="md:col-span-2 md:col-start-7">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Produk</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/#fitur" className="hover:text-blue-400 transition-colors">Fitur Operasional</Link></li>
                <li><Link href="/#harga" className="hover:text-blue-400 transition-colors">Paket Harga</Link></li>
                <li><Link href="/#cara-kerja" className="hover:text-blue-400 transition-colors">Cara Kerja</Link></li>
                <li><Link href="/onboarding?plan=trial" className="hover:text-blue-400 transition-colors">Coba Gratis</Link></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Perusahaan</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-blue-400 transition-colors">Tentang Kami</Link></li>
                <li><Link href="/blog" className="hover:text-blue-400 transition-colors">Artikel &amp; Edukasi</Link></li>
                <li><Link href="/about" className="hover:text-blue-400 transition-colors">Hubungi Tim Kami</Link></li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/terms" className="hover:text-blue-400 transition-colors">Syarat &amp; Ketentuan</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Kebijakan Privasi</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <p>© {new Date().getFullYear()} <strong className="text-slate-400">sistemforwarding.com</strong> — dioperasikan oleh <strong className="text-slate-400">PT. Rafa Kreasindo Teknologi</strong></p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-slate-400 transition-colors">Syarat Layanan</Link>
              <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privasi</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
