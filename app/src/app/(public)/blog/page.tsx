import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getArticlesFromDb } from '@/lib/articles';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Artikel & Edukasi Freight Forwarding Indonesia | Sistem Forwarding',
  description:
    'Pusat edukasi dan panduan praktis operasional freight forwarding, manajemen Job File, regulasi perpajakan PPN 1.1% logistik, dan otomasi TMS autopilot di Indonesia.',
  keywords:
    'blog freight forwarding, edukasi logistik indonesia, panduan job file kargo, ppn logistik 1.1, otomasi invoice freight, tips bisnis ekspedisi',
  alternates: { canonical: 'https://sistemforwarding.com/blog' },
  openGraph: {
    title: 'Artikel & Edukasi Freight Forwarding Indonesia | Sistem Forwarding',
    description:
      'Pusat edukasi dan panduan praktis operasional freight forwarding, manajemen Job File, regulasi perpajakan PPN 1.1% logistik, dan otomasi TMS autopilot.',
    url: 'https://sistemforwarding.com/blog',
    siteName: 'Sistem Forwarding',
    type: 'website',
  },
};

export default async function BlogIndexPage() {
  const articles = await getArticlesFromDb();

  return (
    <div className="font-sans text-slate-800 bg-white selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* ══════════════════════════════════════════
          NAVBAR (Consistent with Homepage)
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
          HERO BANNER
      ══════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm font-semibold text-cyan-300 mb-6">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Pusat Pengetahuan Logistik &amp; Freight Forwarding
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Artikel, Regulasi, &amp; <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Panduan Praktis Forwarder
            </span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
            Wawasan terkurasi dari praktisi logistik dan insinyur <strong>PT. Rafa Kreasindo Teknologi</strong> untuk membantu perusahaan Anda memangkas biaya operasional dan mempercepat perputaran kas.
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
          {['Semua Artikel', 'Operasional Kargo', 'Perpajakan & Finansial', 'Teknologi TMS', 'Manajemen Finansial'].map(
            (category, idx) => (
              <span
                key={category}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  idx === 0
                    ? 'bg-blue-600 text-white shadow-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {category}
              </span>
            )
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ARTICLE GRID (With Real Cover Images from DB)
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
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-blue-700 shadow-sm border border-white/40">
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
                    <span>Baca Artikel</span>
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
        <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 border border-blue-200 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto shadow-sm">
          <span className="text-3xl mb-3 block">🚀</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-3">
            Ingin Mengimplementasikan Sistem Autopilot di Kantor Anda?
          </h3>
          <p className="text-sm text-slate-600 mb-8 max-w-xl mx-auto leading-relaxed">
            Tim konsultan logistik <strong>PT. Rafa Kreasindo Teknologi</strong> siap mendampingi migrasi data pelanggan, vendor, dan penomoran dokumen perusahaan Anda tanpa kendala.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/onboarding?plan=trial"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <span>Daftar Uji Coba Gratis 7 Hari</span>
              <span>→</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              Profil Perusahaan Kami
            </Link>
          </div>
        </div>
      </section>

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
