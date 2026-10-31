import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan Layanan | Sistem Forwarding',
  description: 'Syarat dan ketentuan penggunaan platform SaaS ERP & TMS sistemforwarding.com yang dioperasikan oleh PT. Rafa Kreasindo Teknologi.',
};

export default function TermsPage() {
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
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Syarat &amp; Ketentuan Layanan</h1>
          <p className="text-blue-200 text-sm">Terakhir diperbarui: 31 Oktober 2026 · PT. Rafa Kreasindo Teknologi</p>
        </div>
      </section>

      <main className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-sm sm:text-base text-slate-600 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">1. Ketentuan Umum</h2>
          <p>
            Selamat datang di <strong>sistemforwarding.com</strong>. Platform ini dimiliki, dioperasikan, dan dikelola secara legal oleh <strong>PT. Rafa Kreasindo Teknologi</strong>. Dengan mengakses dan mendaftarkan ruang kerja (tenant) di platform kami, Anda menyetujui seluruh ketentuan yang tercantum dalam dokumen ini.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">2. Ruang Lingkup Layanan</h2>
          <p>
            Sistem Forwarding menyediakan perangkat lunak berbasis cloud (Software-as-a-Service) untuk memfasilitasi administrasi freight forwarding, termasuk pembuatan Job File, pencetakan dokumen transportasi (AWB/BL), penerbitan faktur komersial dengan perhitungan PPN 1.1%, dan rekonsiliasi pembayaran.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">3. Tanggung Jawab &amp; Isolasi Data</h2>
          <p>
            Setiap pengguna bertanggung jawab atas kebenaran data manifest kargo dan transaksi finansial yang dimasukkan ke dalam sistem. PT. Rafa Kreasindo Teknologi menjamin isolasi data mutlak antar tenant melalui arsitektur multi-tenant PostgreSQL. Data operasional Anda tidak akan pernah dibagikan atau dapat diakses oleh pihak ketiga tanpa persetujuan tertulis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">4. Berlangganan &amp; Pembatalan</h2>
          <p>
            Layanan langganan dapat diuji coba secara gratis selama 7 hari. Setelah periode uji coba, perpanjangan dilakukan secara berkala sesuai paket yang dipilih (Bulanan atau Tahunan). Anda dapat menghentikan langganan sewaktu-waktu melalui menu pengaturan konsol tanpa denda penalti.
          </p>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-400 py-10 text-center text-xs">
        <p>© {new Date().getFullYear()} sistemforwarding.com · PT. Rafa Kreasindo Teknologi. Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
