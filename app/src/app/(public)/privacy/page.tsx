import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi Data | Sistem Forwarding',
  description: 'Kebijakan privasi dan perlindungan data pelanggan platform SaaS sistemforwarding.com oleh PT. Rafa Kreasindo Teknologi.',
};

export default function PrivacyPage() {
  return (
    <div className="font-sans text-slate-800 bg-white selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-6 h-16 shadow-lg shadow-slate-900/5">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Sistem Forwarding" width={180} height={44} className="h-10 w-auto object-contain" priority />
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <Link href="/#fitur" className="hover:text-blue-600 transition-colors">Fitur</Link>
              <Link href="/#harga" className="hover:text-blue-600 transition-colors">Harga</Link>
              <Link href="/blog" className="hover:text-blue-600 transition-colors">Edukasi</Link>
              <Link href="/about" className="hover:text-blue-600 transition-colors">Tentang Kami</Link>
            </nav>
            <Link href="/onboarding?plan=trial" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md">
              Coba Gratis →
            </Link>
          </div>
        </div>
      </header>

      <section className="relative pt-36 pb-16 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Kebijakan Privasi Data</h1>
          <p className="text-blue-200 text-sm">Standar Keamanan Data Enterprise · PT. Rafa Kreasindo Teknologi</p>
        </div>
      </section>

      <main className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">1. Komitmen Perlindungan Privasi</h2>
          <p>
            <strong>PT. Rafa Kreasindo Teknologi</strong> berkomitmen penuh menjaga kerahasiaan dan integritas informasi operasional dan finansial yang Anda percayakan kepada sistem kami. Kami memberlakukan standar perlindungan data yang ketat sesuai regulasi perlindungan data pribadi yang berlaku di Indonesia.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">2. Data yang Dikumpulkan</h2>
          <p>
            Data yang diproses di dalam platform mencakup: informasi profil akun Google (nama dan alamat email), nama entitas usaha, daftar shipper/consignee yang Anda simpan, manifest rincian kargo, dan rekonsiliasi pembayaran faktur. Seluruh data tersebut adalah hak milik mutlak perusahaan (tenant) Anda.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">3. Isolasi Database Multi-Tenant</h2>
          <p>
            Sistem kami dirancang dengan prinsip isolasi multi-tenant yang ketat. Setiap kueri basis data diisolasi berdasarkan Tenant ID dan subdomain unik, mencegah kebocoran tarif negosiasi antar forwarder kompetitor. Enkripsi 256-bit SSL diterapkan pada seluruh lalu lintas data.
          </p>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-400 py-10 text-center text-xs">
        <p>© {new Date().getFullYear()} sistemforwarding.com · PT. Rafa Kreasindo Teknologi. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
