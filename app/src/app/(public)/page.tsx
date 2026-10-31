import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getActivePlans } from '@/actions/planActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sistem Forwarding | Software Manajemen Kargo & Freight Forwarding Terbaik',
  description:
    'Software ERP & TMS khusus freight forwarding Indonesia. Kelola Job File, cetak AWB/HBL, invoice otomatis, laporan laba/rugi — semua dalam satu sistem. Coba gratis 7 hari.',
  keywords:
    'software freight forwarding indonesia, sistem forwarding, aplikasi kargo, tms forwarding, software logistik',
  alternates: { canonical: 'https://sistemforwarding.com' },
  openGraph: {
    title: 'Sistem Forwarding | Software Kargo Autopilot',
    description: 'Platform ERP & TMS khusus perusahaan freight forwarding Indonesia.',
    url: 'https://sistemforwarding.com',
    siteName: 'Sistem Forwarding',
    locale: 'id_ID',
    type: 'website',
  },
};

// ─── SVG Dashboard Mockup ─────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <svg
      viewBox="0 0 900 560"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      role="img"
      aria-label="Tampilan dasbor Sistem Forwarding"
    >
      {/* Browser chrome */}
      <rect width="900" height="560" rx="16" fill="#1e2030" />
      <rect width="900" height="42" rx="16" fill="#272a3d" />
      <rect y="28" width="900" height="14" fill="#272a3d" />
      <circle cx="22" cy="21" r="6" fill="#ff5f57" />
      <circle cx="42" cy="21" r="6" fill="#febc2e" />
      <circle cx="62" cy="21" r="6" fill="#28c840" />
      <rect x="140" y="12" width="240" height="18" rx="9" fill="#1a1d2e" />

      {/* Sidebar */}
      <rect x="0" y="42" width="160" height="518" rx="0" fill="#151728" />
      <rect x="12" y="62" width="136" height="36" rx="8" fill="#2563eb" />
      <rect x="20" y="74" width="80" height="12" rx="6" fill="#ffffff" fillOpacity="0.9" />
      {[110, 156, 202, 248, 294].map((y, i) => (
        <g key={i}>
          <rect x="20" y={y} width="14" height="14" rx="3" fill="#3b82f6" fillOpacity={i === 0 ? 1 : 0.35} />
          <rect x="42" y={y + 1} width={[72, 60, 80, 52, 64][i]} height="10" rx="5" fill="#94a3b8" fillOpacity={i === 0 ? 0.9 : 0.45} />
        </g>
      ))}

      {/* Main area */}
      <rect x="160" y="42" width="740" height="518" fill="#0f1120" />

      {/* Top bar */}
      <rect x="160" y="42" width="740" height="44" fill="#151728" />
      <rect x="176" y="54" width="140" height="18" rx="9" fill="#1e2235" />
      <rect x="750" y="54" width="60" height="18" rx="9" fill="#2563eb" />
      <circle cx="840" cy="63" r="14" fill="#1e2235" />
      <circle cx="840" cy="60" r="8" fill="#6366f1" fillOpacity="0.6" />

      {/* Stats row */}
      {[
        { x: 176, color: '#3b82f6', label: 'Total Job File', val: '1.284', sub: '+24 hari ini' },
        { x: 412, color: '#06b6d4', label: 'Invoice Terbit', val: 'Rp 842 Jt', sub: 'bulan ini' },
        { x: 648, color: '#10b981', label: 'Selisih Laba', val: 'Rp 128 Jt', sub: 'estimasi bersih' },
      ].map((s) => (
        <g key={s.x}>
          <rect x={s.x} y="102" width="220" height="80" rx="12" fill="#1a1d2e" />
          <rect x={s.x + 12} y="114" width="8" height="28" rx="4" fill={s.color} />
          <rect x={s.x + 28} y="114" width="80" height="8" rx="4" fill="#475569" />
          <rect x={s.x + 28} y="128" width={[110, 100, 90][([176, 412, 648].indexOf(s.x))]} height="14" rx="7" fill="#f1f5f9" fillOpacity="0.9" />
          <rect x={s.x + 28} y="150" width="60" height="8" rx="4" fill={s.color} fillOpacity="0.7" />
        </g>
      ))}

      {/* Chart area */}
      <rect x="176" y="196" width="460" height="200" rx="12" fill="#1a1d2e" />
      <rect x="192" y="210" width="100" height="10" rx="5" fill="#f1f5f9" fillOpacity="0.7" />
      <polyline
        points="192,360 240,320 290,340 340,290 390,310 440,260 490,280 540,240 590,260 620,230"
        fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round"
      />
      <polygon
        points="192,360 240,320 290,340 340,290 390,310 440,260 490,280 540,240 590,260 620,230 620,380 192,380"
        fill="url(#blueGrad)" fillOpacity="0.2"
      />
      <polyline
        points="192,380 240,355 290,365 340,340 390,350 440,320 490,335 540,310 590,325 620,305"
        fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" strokeDasharray="4 2"
      />
      <defs>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Job File table */}
      <rect x="176" y="410" width="460" height="140" rx="12" fill="#1a1d2e" />
      <rect x="192" y="422" width="80" height="10" rx="5" fill="#f1f5f9" fillOpacity="0.7" />
      {['SF-20261031', 'SF-20261030', 'SF-20261029'].map((no, i) => (
        <g key={no}>
          <rect x="192" y={446 + i * 34} width="420" height="28" rx="6" fill={i % 2 === 0 ? '#151728' : 'transparent'} />
          <rect x="200" y={452 + i * 34} width="90" height="10" rx="5" fill="#94a3b8" fillOpacity="0.7" />
          <rect x="310" y={452 + i * 34} width="70" height="10" rx="5" fill="#94a3b8" fillOpacity="0.5" />
          <rect x="500" y={450 + i * 34} width="60" height="14" rx="7"
            fill={['#dcfce7', '#fef9c3', '#dbeafe'][i]}
          />
          <rect x="510" y={454 + i * 34} width="40" height="7" rx="3.5"
            fill={['#16a34a', '#ca8a04', '#2563eb'][i]}
          />
        </g>
      ))}

      {/* Right panel */}
      <rect x="652" y="196" width="232" height="354" rx="12" fill="#1a1d2e" />
      <rect x="668" y="212" width="100" height="10" rx="5" fill="#f1f5f9" fillOpacity="0.7" />
      {[
        { label: 'PT. Maju Logistics', val: 'Rp 24 Jt', color: '#3b82f6' },
        { label: 'CV. Nusantara Cargo', val: 'Rp 18 Jt', color: '#06b6d4' },
        { label: 'PT. Indo Express', val: 'Rp 32 Jt', color: '#10b981' },
        { label: 'PT. Trans Global', val: 'Rp 11 Jt', color: '#f59e0b' },
      ].map((item, i) => (
        <g key={i}>
          <rect x="668" y={238 + i * 64} width="200" height="52" rx="8" fill="#0f1120" />
          <rect x="680" y={250 + i * 64} width="8" height="28" rx="4" fill={item.color} />
          <rect x="696" y={250 + i * 64} width="80" height="8" rx="4" fill="#94a3b8" fillOpacity="0.7" />
          <rect x="696" y={264 + i * 64} width="60" height="10" rx="5" fill="#f1f5f9" fillOpacity="0.85" />
        </g>
      ))}
      <rect x="668" y="498" width="200" height="36" rx="8" fill="#2563eb" />
      <rect x="720" y="510" width="96" height="12" rx="6" fill="#fff" fillOpacity="0.9" />
    </svg>
  );
}

// ─── Check Icon ────────────────────────────────────────────────────────────────
function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${className}`} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default async function LandingPage() {
  const plans = await getActivePlans();

  return (
    <div className="font-sans text-slate-800 overflow-x-hidden selection:bg-blue-200">

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-6 h-16 shadow-lg shadow-slate-900/5">
            {/* Logo */}
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
            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
              <a href="#fitur" className="hover:text-blue-600 transition-colors">Fitur</a>
              <a href="#live-demo" className="text-blue-600 font-bold hover:text-blue-700 transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Live Demo</span>
              </a>
              <a href="#cara-kerja" className="hover:text-blue-600 transition-colors">Cara Kerja</a>
              <a href="#harga" className="hover:text-blue-600 transition-colors">Harga</a>
              <Link href="/blog" className="hover:text-blue-600 transition-colors">Edukasi</Link>
              <Link href="/about" className="hover:text-blue-600 transition-colors">Tentang Kami</Link>
            </nav>
            {/* CTA */}
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
                #1 Software Freight Forwarding Indonesia
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
                Kelola Kargo.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Cetak Invoice.
                </span><br />
                Dapat Bayaran.
              </h1>

              {/* Sub */}
              <p className="text-lg md:text-xl text-blue-100/80 leading-relaxed max-w-lg mb-10">
                Tinggalkan Excel dan tumpukan kertas. <strong className="text-white">Sistem Forwarding</strong> menyatukan
                seluruh alur kerja ekspor, impor & kargo domestik — dari Job File hingga tagihan pelanggan — dalam satu layar.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Link
                  href="/onboarding?plan=trial"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 text-base font-bold rounded-xl shadow-2xl shadow-black/20 hover:bg-blue-50 transition-all transform hover:-translate-y-0.5 hover:shadow-white/20"
                >
                  Mulai Uji Coba Gratis
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#live-demo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white text-base font-semibold rounded-xl hover:bg-white/15 backdrop-blur-sm transition-all"
                >
                  <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Lihat Live Demo
                </a>
              </div>

              {/* Direct Demo Quick Launcher */}
              <div className="flex flex-wrap items-center gap-2.5 mb-10 text-xs">
                <span className="text-cyan-300 font-bold uppercase tracking-wider text-[11px]">Buka Langsung:</span>
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
                {[
                  { num: '1.200+', label: 'Job File Diproses' },
                  { num: '50+', label: 'Perusahaan Aktif' },
                  { num: '99.9%', label: 'Uptime Layanan' },
                ].map((s) => (
                  <div key={s.num} className="text-center sm:text-left">
                    <p className="text-3xl font-extrabold text-white">{s.num}</p>
                    <p className="text-sm text-blue-200/70 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Dashboard Mockup */}
            <div className="relative lg:block">
              {/* Glow behind mockup */}
              <div className="absolute inset-0 bg-blue-400/20 rounded-3xl blur-3xl scale-90 pointer-events-none" />

              {/* Floating badges */}
              <div className="absolute -top-6 -left-4 z-10 flex items-center gap-2 bg-white rounded-2xl shadow-2xl px-4 py-3 border border-slate-100">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Job File Baru</p>
                  <p className="text-sm font-bold text-slate-800">SF-20261031-084</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-2 z-10 flex items-center gap-2 bg-white rounded-2xl shadow-2xl px-4 py-3 border border-slate-100">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">✓</div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Invoice Lunas</p>
                  <p className="text-sm font-bold text-green-600">+Rp 24.000.000</p>
                </div>
              </div>

              {/* Main mockup frame */}
              <div className="relative rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-white/10">
                <DashboardMockup />
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
          TRUST BAR — Logo Brand
      ══════════════════════════════════════════ */}
      <section className="bg-slate-50 py-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Dipercaya perusahaan freight forwarding di seluruh Indonesia
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4">
            {['PT. Maju Logistics', 'CV. Nusantara Cargo', 'PT. Indo Express', 'PT. Trans Global Freight', 'PT. Samudra Jaya'].map((name) => (
              <span key={name} className="text-sm font-bold text-slate-300 tracking-wide uppercase">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LIVE DEMO SHOWCASE — Interactive Portals
      ══════════════════════════════════════════ */}
      <section id="live-demo" className="py-24 bg-gradient-to-b from-slate-50 to-white border-b border-slate-150 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-200/70">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Live Multi-Tenant Workspaces
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Coba Langsung Portal Operasional Forwarder
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Setiap perusahaan forwarder mendapatkan portal subdomain eksklusif dengan database PostgreSQL terisolasi. Klik salah satu portal demo di bawah untuk masuk ke console:
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
                    Enterprise Corpora
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  PT. Demo 1 Company
                </h3>
                <p className="text-xs font-mono font-bold text-blue-600 mt-1 mb-4">
                  https://demo1.sistemforwarding.com
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Spesialisasi pengiriman ekspor laut &amp; udara (FCL/LCL Tanjung Priok - Port of Singapore via Maersk Line). Mengelola penerbitan draft HBL, kontrol selisih laba kotor, dan monitoring invoice piutang pelanggan.
                </p>

                <div className="space-y-2 mb-8 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">Email Akun:</span>
                    <strong className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">demo1@sistemforwarding.com</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">Kata Sandi:</span>
                    <span className="font-mono text-slate-800">demo12345 (Tersedia Tombol Cepat)</span>
                  </div>
                </div>
              </div>

              <a
                href="https://demo1.sistemforwarding.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all transform group-hover:-translate-y-0.5"
              >
                <span>Buka Portal Demo 1</span>
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
                    Bisnis Profesional
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  PT. Demo 2 Company
                </h3>
                <p className="text-xs font-mono font-bold text-indigo-600 mt-1 mb-4">
                  https://demo2.sistemforwarding.com
                </p>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Spesialisasi pengiriman kargo ekspor furnitur (Semarang - Hamburg via Samudera Indonesia) &amp; sampel udara (CGK - New York JFK via SQ Cargo). Mengelola rekonsiliasi PPN 1.1%, kartu vendor, dan manifes kontainer.
                </p>

                <div className="space-y-2 mb-8 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">Email Akun:</span>
                    <strong className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">demo2@sistemforwarding.com</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500">Kata Sandi:</span>
                    <span className="font-mono text-slate-800">demo12345 (Tersedia Tombol Cepat)</span>
                  </div>
                </div>
              </div>

              <a
                href="https://demo2.sistemforwarding.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all transform group-hover:-translate-y-0.5"
              >
                <span>Buka Portal Demo 2</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FITUR — Alternating Layout
      ══════════════════════════════════════════ */}
      <section id="fitur" className="py-28 bg-white scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-4">
              Fitur Unggulan
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">
              Semua yang Anda Butuhkan<br className="hidden md:block" />
              <span className="text-blue-600"> dalam Satu Platform</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Dirancang khusus untuk alur kerja perusahaan freight forwarder — bukan software akuntansi umum yang dipaksakan.
            </p>
          </div>

          {/* Feature rows */}
          {[
            {
              icon: '📦',
              color: 'blue',
              tag: 'Manajemen Kargo',
              title: 'Job File Terpusat dengan Nomor Otomatis',
              body: 'Setiap pengiriman dicatat dalam satu Job File dengan nomor unik yang digenerate otomatis. Tidak ada lagi pengiriman yang tertukar atau dokumen yang hilang.',
              bullets: ['Ekspor, Impor & Domestik dalam satu layar', 'Cetak AWB, HBL, BL, DO, & Packing List', 'Lacak status pengiriman real-time', 'Upload dokumen pendukung langsung ke Job File'],
              accent: 'from-blue-500 to-blue-600',
              bg: 'from-blue-50 to-indigo-50',
              reverse: false,
            },
            {
              icon: '🧾',
              color: 'cyan',
              tag: 'Keuangan & Tagihan',
              title: 'Invoice Otomatis & Laporan Laba/Rugi Instan',
              body: 'Tagihan terbit langsung dari data Job File. Tidak perlu input ulang. Pantau selisih antara biaya vendor (hutang) dan tagihan pelanggan (piutang) secara real-time.',
              bullets: ['Invoice komersial + PPN 1.1% otomatis terhitung', 'Monitoring umur piutang (Aging AR) & jatuh tempo', 'Laporan laba/rugi per Job File & periode', 'Pencatatan status pelunasan faktur praktis'],
              accent: 'from-cyan-500 to-blue-500',
              bg: 'from-cyan-50 to-blue-50',
              reverse: true,
            },
            {
              icon: '🏢',
              color: 'indigo',
              tag: 'Portal Mandiri',
              title: 'Ruang Kerja Eksklusif untuk Perusahaan Anda',
              body: 'Setiap perusahaan mendapat subdomain login mandiri (contoh: demo1.sistemforwarding.com). Data Anda 100% terisolasi dari perusahaan lain.',
              bullets: ['Unggah logo perusahaan Anda sendiri', 'Kelola akun staf & hak akses', 'Data pelanggan & vendor eksklusif', 'Backup data otomatis setiap hari'],
              accent: 'from-indigo-500 to-purple-600',
              bg: 'from-indigo-50 to-purple-50',
              reverse: false,
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className={`flex flex-col ${feat.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20 mb-28 last:mb-0`}
            >
              {/* Visual panel */}
              <div className={`w-full lg:w-1/2 rounded-3xl bg-gradient-to-br ${feat.bg} p-10 flex items-center justify-center min-h-80 border border-slate-100 shadow-xl shadow-slate-100`}>
                <div className="text-center">
                  <div className="w-28 h-28 rounded-3xl bg-white shadow-xl flex items-center justify-center text-6xl mb-6 mx-auto">
                    {feat.icon}
                  </div>
                  <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${feat.accent} text-white text-sm font-bold shadow-lg`}>
                    {feat.tag}
                  </div>
                </div>
              </div>
              {/* Text */}
              <div className="w-full lg:w-1/2">
                <span className={`text-sm font-bold text-${feat.color}-600 uppercase tracking-widest`}>{feat.tag}</span>
                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-5 leading-tight">{feat.title}</h3>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">{feat.body}</p>
                <ul className="space-y-4">
                  {feat.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r ${feat.accent} flex items-center justify-center`}>
                        <CheckIcon className="text-white w-3.5 h-3.5" />
                      </span>
                      <span className="text-slate-700 font-medium">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CARA KERJA — 3 Steps (Interactive & Smooth)
      ══════════════════════════════════════════ */}
      <section id="cara-kerja" className="py-28 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden scroll-mt-24">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-bold mb-4 border border-cyan-400/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Alur Kerja Autopilot
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Aktif &amp; Beroperasi dalam{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
              3 Langkah Mudah
            </span>
          </h2>
          <p className="text-base md:text-lg text-blue-100/70 max-w-2xl mx-auto mb-16 leading-relaxed">
            Tanpa instalasi server rumit. Cukup buka browser kantor Anda, lakukan setup awal dalam hitungan menit, dan sistem langsung siap bekerja.
          </p>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Desktop Connector Line with Glowing Gradient */}
            <div className="hidden md:block absolute top-20 left-[18%] right-[18%] h-0.5 bg-gradient-to-r from-cyan-500/20 via-cyan-400/60 to-blue-500/20 pointer-events-none" />

            {[
              {
                step: '01',
                icon: '🚀',
                title: 'Daftar & Buat Ruang Kerja',
                desc: 'Login via Akun Google resmi perusahaan Anda. Tentukan subdomain eksklusif (contoh: demo1). Ruang kerja PostgreSQL terisolasi langsung aktif seketika.',
                pills: ['Subdomain Instan', 'SSO Google', 'Provisi Otomatis'],
                gradient: 'from-cyan-400 to-blue-500',
              },
              {
                step: '02',
                icon: '📋',
                title: 'Input Job File & Terbitkan Dokumen',
                desc: 'Catat detail shipper, consignee, nomor kontainer, dan rute pelabuhan. Nomor Job File terbit otomatis. Cetak HBL, AWB, atau DO langsung dalam format PDF.',
                pills: ['Auto MasterPrefix', 'Cetak AWB/BL PDF', 'Tracking Kargo'],
                gradient: 'from-blue-500 to-indigo-500',
              },
              {
                step: '03',
                icon: '💰',
                title: 'Terbitkan Invoice & Pantau Pembayaran',
                desc: 'Faktur komersial langsung terkalkulasi dari data Job File lengkap dengan PPN 1.1%. Terbitkan invoice resmi siap kirim ke pelanggan ekspor/impor Anda.',
                pills: ['Kalkulasi PPN 1.1%', 'Invoice Otomatis', 'Monitoring Piutang'],
                gradient: 'from-indigo-500 to-purple-500',
              },
            ].map((s, i) => (
              <div
                key={i}
                className="group relative flex flex-col items-center text-center p-8 sm:p-9 rounded-3xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-400/50 backdrop-blur-xl shadow-xl hover:shadow-[0_15px_40px_rgba(6,182,212,0.15)] transition-all duration-500 transform hover:-translate-y-2"
              >
                {/* Step Number Circle */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${s.gradient} flex items-center justify-center text-white font-black text-xl mb-6 shadow-xl shadow-cyan-500/20 ring-4 ring-white/10 group-hover:ring-cyan-400/40 group-hover:scale-110 group-hover:rotate-1 transition-all duration-300`}
                >
                  {s.step}
                </div>

                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {s.icon}
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                  {s.title}
                </h3>

                <p className="text-sm text-blue-100/70 leading-relaxed mb-6 flex-1">
                  {s.desc}
                </p>

                {/* Sub-feature badges */}
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
            ))}
          </div>

          {/* Smooth CTA inside How It Works */}
          <div className="mt-14 text-center">
            <Link
              href="/onboarding?plan=trial"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-blue-600 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span>Mulai Uji Coba 3 Langkah Ini Sekarang</span>
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
            Kata Mereka
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-16">
            Dipercaya Forwarder<br className="hidden md:block" />
            <span className="text-blue-600">dari Sabang sampai Merauke</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Hendro Wijaya',
                role: 'Direktur Operasional',
                company: 'PT. Maju Logistics',
                avatar: 'HW',
                color: 'from-blue-500 to-blue-600',
                quote: '"Sebelum pakai Sistem Forwarding, kami pakai 3 spreadsheet berbeda. Sekarang semua terpusat. Job File sampai invoice selesai 3x lebih cepat."',
                stars: 5,
              },
              {
                name: 'Linda Sari',
                role: 'Finance Manager',
                company: 'CV. Nusantara Cargo',
                avatar: 'LS',
                color: 'from-cyan-500 to-blue-500',
                quote: '"Laporan laba/rugi yang dulu makan waktu 2 minggu sekarang bisa saya lihat real-time setiap hari. Tagihan ke klien juga jarang yang telat sekarang."',
                stars: 5,
              },
              {
                name: 'Budi Santoso',
                role: 'Owner',
                company: 'PT. Indo Express Freight',
                avatar: 'BS',
                color: 'from-indigo-500 to-purple-600',
                quote: '"Saya rekomendasi ke semua teman-teman forwarder. Support-nya responsif, sistemnya stabil. Sudah 8 bulan tidak ada masalah sama sekali."',
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-3xl p-8 text-left shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed flex-1 mb-6 text-base italic">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role} · {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING — Dynamic dari DB
      ══════════════════════════════════════════ */}
      <section id="harga" className="py-28 bg-white relative overflow-hidden scroll-mt-24">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-4">
              Paket Harga
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">
              Investasi Transparan,<br />
              <span className="text-blue-600">Tanpa Biaya Tersembunyi</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Harga langsung dari sistem kami. Pilih paket sesuai skala bisnis Anda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-2xl shadow-blue-600/40 scale-105 border-0'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-lg shadow-slate-200/60 hover:border-blue-200 hover:shadow-xl'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                    ⭐ Paling Populer
                  </div>
                )}
                <div className={`p-8 ${plan.isPopular ? '' : ''}`}>
                  <h3 className={`text-xl font-bold mb-1 ${plan.isPopular ? 'text-blue-100' : 'text-slate-500'}`}>{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-2">
                    <span className={`text-4xl md:text-5xl font-extrabold ${plan.isPopular ? 'text-white' : 'text-slate-900'}`}>
                      {plan.price === 0 ? 'Gratis' : `Rp ${plan.price.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <p className={`text-sm font-medium mb-8 ${plan.isPopular ? 'text-blue-200' : 'text-slate-400'}`}>{plan.period}</p>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckIcon className={plan.isPopular ? 'text-cyan-300' : 'text-blue-500'} />
                        <span className={`text-sm ${plan.isPopular ? 'text-blue-100' : 'text-slate-600'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/onboarding?plan=${plan.planKey || plan.id}`}
                    className={`block w-full py-3.5 text-center rounded-xl font-bold text-sm transition-all ${
                      plan.isPopular
                        ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-lg'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                    }`}
                  >
                    {plan.price === 0 ? 'Mulai Gratis Sekarang' : 'Pilih Paket Ini'}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-10">
            Semua paket termasuk setup awal & onboarding. Tidak ada kontrak jangka panjang. Batalkan kapan saja.
          </p>
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
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Siap Tinggalkan<br />Excel Selamanya?
          </h2>
          <p className="text-xl text-blue-100/80 mb-10 max-w-xl mx-auto">
            Ribuan job file diproses setiap bulan. Bergabunglah sekarang — gratis 7 hari, tanpa kartu kredit.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/onboarding?plan=trial"
              className="px-10 py-5 bg-white text-blue-700 text-lg font-black rounded-2xl shadow-2xl shadow-black/20 hover:bg-blue-50 transition-all transform hover:-translate-y-0.5"
            >
              Daftar Gratis — Mulai Hari Ini 🚀
            </Link>
            <Link
              href="/about"
              className="px-10 py-5 bg-white/10 border border-white/20 text-white text-lg font-semibold rounded-2xl hover:bg-white/20 backdrop-blur-sm transition-all"
            >
              Tentang Kami
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-slate-950 text-slate-400 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-12 pb-16 border-b border-slate-800">
            {/* Brand col */}
            <div className="md:col-span-5">
              <Image
                src="/logo.png"
                alt="Sistem Forwarding Logo"
                width={180}
                height={50}
                className="h-12 w-auto mb-6 brightness-0 invert opacity-80"
              />
              <p className="text-slate-400 leading-relaxed max-w-sm mb-6">
                Platform ERP & TMS berbasis web khusus untuk perusahaan freight forwarding Indonesia.
                Dari Job File hingga laporan laba/rugi — semua terpusat.
              </p>
              {/* Legal badge */}
              <div className="inline-block bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4">
                <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Badan Hukum</p>
                <p className="text-white font-bold text-sm">PT. Rafa Kreasindo Teknologi</p>
                <p className="text-xs text-slate-500 mt-1">© {new Date().getFullYear()} Hak Cipta Dilindungi</p>
              </div>
            </div>

            {/* Links */}
            <div className="md:col-span-2 md:col-start-7">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Produk</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { href: 'https://demo1.sistemforwarding.com', label: 'Demo 1 (PT. Demo 1)' },
                  { href: 'https://demo2.sistemforwarding.com', label: 'Demo 2 (PT. Demo 2)' },
                  { href: '#fitur', label: 'Fitur Operasional' },
                  { href: '#live-demo', label: 'Live Demo Portals' },
                  { href: '#harga', label: 'Paket Harga' },
                  { href: '#cara-kerja', label: 'Cara Kerja' },
                  { href: '/onboarding?plan=trial', label: 'Coba Gratis' },
                ].map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('http') ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span>{l.label}</span>
                      </a>
                    ) : l.href.startsWith('#') ? (
                      <a href={l.href} className="hover:text-blue-400 transition-colors">{l.label}</a>
                    ) : (
                      <Link href={l.href} className="hover:text-blue-400 transition-colors">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Perusahaan</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { href: '/about', label: 'Tentang Kami' },
                  { href: '/blog', label: 'Artikel & Edukasi' },
                  { href: '/about#kontak', label: 'Hubungi Kami' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-blue-400 transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-5">Legal</h4>
              <ul className="space-y-3 text-sm">
                {[
                  { href: '/terms', label: 'Syarat & Ketentuan' },
                  { href: '/privacy', label: 'Kebijakan Privasi' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-blue-400 transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
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
