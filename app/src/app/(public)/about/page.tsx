import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tentang Kami | PT. Rafa Kreasindo Teknologi - Pengembang Sistem Forwarding',
  description:
    'Profil resmi PT. Rafa Kreasindo Teknologi, pengembang sistemforwarding.com. Solusi SaaS ERP & TMS B2B multi-tenant terpercaya untuk modernisasi freight forwarding Indonesia.',
  keywords:
    'tentang sistem forwarding, PT Rafa Kreasindo Teknologi, profil perusahaan software logistik, legalitas sistemforwarding, cloud tms indonesia',
  alternates: { canonical: 'https://sistemforwarding.com/about' },
  openGraph: {
    title: 'Tentang Kami | PT. Rafa Kreasindo Teknologi - Sistem Forwarding',
    description:
      'Profil resmi pengembang platform SaaS sistemforwarding.com. Solusi enterprise TMS & ERP multi-tenant freight forwarding.',
    url: 'https://sistemforwarding.com/about',
    siteName: 'Sistem Forwarding',
    type: 'website',
  },
};

export default function AboutPage() {
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
              <Link href="/blog" className="hover:text-blue-600 transition-colors">Edukasi</Link>
              <Link href="/about" className="text-blue-600 font-bold transition-colors">Tentang Kami</Link>
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
          HERO BANNER (Deep Gradient)
      ══════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm font-semibold text-cyan-300 mb-6">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Profil Resmi Perusahaan &amp; Integritas EEAT
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Membangun Standar Baru <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Freight Forwarding Indonesia
            </span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
            <strong>Sistem Forwarding</strong> didirikan untuk mengakhiri era spreadsheet manual yang rawan salah hitung,
            birokrasi invoice yang lambat, dan dokumen kargo yang tercecer di industri logistik nasional.
          </p>

          {/* Highlights row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {[
              { val: '100%', label: 'Isolasi Data PostgreSQL' },
              { val: '99.9%', label: 'SLA Uptime Cloud' },
              { val: '1.1%', label: 'PPN Otomatis PMK' },
              { val: '256-bit', label: 'Enkripsi Data SSL' },
            ].map((stat) => (
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
                  Entitas Hukum &amp; Legalitas Resmi
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-5 text-white">
                  PT. Rafa Kreasindo Teknologi
                </h2>
                <p className="text-slate-300 text-base leading-relaxed mb-8">
                  Platform <strong>sistemforwarding.com</strong> dikembangkan, dipelihara, dan dioperasikan secara legal penuh di bawah naungan PT. Rafa Kreasindo Teknologi sebagai perseroan teknologi enterprise terdaftar di Republik Indonesia.
                </p>

                <div className="space-y-4 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</span>
                    <span><strong>Klasifikasi Usaha:</strong> Penyedia Layanan Perangkat Lunak Berbasis Cloud (SaaS B2B TMS/ERP) untuk sektor transportasi &amp; logistik.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</span>
                    <span><strong>Kepatuhan Regulasi Pajak:</strong> Otomasi perhitungan besaran tertentu PPN 1.1% atas Jasa Pengurusan Transportasi (JPT) dan integrasi faktur komersial.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">✓</span>
                    <span><strong>Keamanan Data Pelanggan:</strong> Sistem isolasi database multi-tenant mandiri tanpa risiko tercampurnya data tarif buying/selling antar forwarder.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-7 border border-white/10 space-y-5">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 flex items-center justify-between">
                  <span>Informasi Resmi Entitas</span>
                  <span className="text-xs text-emerald-400 font-normal flex items-center gap-1">● Terverifikasi</span>
                </h3>
                <div className="space-y-3.5 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Nama Perusahaan:</span>
                    <strong className="text-white text-sm">PT. Rafa Kreasindo Teknologi</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Produk Utama:</span>
                    <strong className="text-cyan-300 font-mono text-sm">sistemforwarding.com</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Layanan:</span>
                    <span className="text-white">ERP &amp; TMS Forwarding (Multi-Tenant Autopilot)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Standar Keamanan:</span>
                    <span className="text-white">256-Bit SSL/TLS, Automated Daily DB Backup</span>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/onboarding?plan=trial"
                      className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-xl transition-all shadow-lg"
                    >
                      Buka Ruang Kerja Perusahaan →
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
              Prinsip Keunggulan
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Pilar Arsitektur Sistem Kami
            </h2>
            <p className="text-base text-slate-500 max-w-2xl mx-auto">
              Dibangun dengan standar rekayasa perangkat lunak modern untuk memastikan kecepatan, keamanan, dan skalabilitas bisnis logistik Anda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-100 hover:border-blue-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-6">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Isolasi Multi-Tenant Mutlak</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Setiap perusahaan beroperasi pada subdomain mandiri dengan relasi basis data PostgreSQL yang terpisah secara ketat. Margin keuntungan dan tarif vendor Anda terjamin 100% aman dan rahasia.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-100 hover:border-cyan-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-3xl mb-6">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Automasi Autopilot End-to-End</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dari penomoran Job File otomatis, kalkulasi pajak PPN 1.1%, penerbitan invoice komersial instan, hingga pemantauan status piutang dan laba rugi kargo secara real-time.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-100 hover:border-indigo-300 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mb-6">
                🤝
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Dukungan Ahli Praktisi Logistik</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Didukung langsung oleh konsultan dan teknisi yang memahami alur dokumen kargo nyata: Ocean Bill of Lading (BL), Air Waybill (AWB), manifest kargo, Delivery Order (DO), dan pembukuan kas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="relative py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Siap Mentransformasi Operasional Forwarding Anda?
          </h2>
          <p className="text-lg text-blue-100/90 mb-8 max-w-xl mx-auto">
            Bergabunglah dengan puluhan perusahaan logistik modern di Indonesia. Nikmati uji coba gratis 7 hari sekarang.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/onboarding?plan=trial"
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl shadow-xl hover:bg-blue-50 transition-all transform hover:-translate-y-0.5"
            >
              Mulai Uji Coba Gratis 7 Hari 🚀
            </Link>
            <Link
              href="/blog"
              className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 backdrop-blur-sm transition-all"
            >
              Baca Artikel Edukasi
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
