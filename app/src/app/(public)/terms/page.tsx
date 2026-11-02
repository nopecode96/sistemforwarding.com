import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan Layanan | Sistem Forwarding',
  description: 'Syarat dan ketentuan penggunaan platform SaaS ERP & TMS sistemforwarding.com yang dioperasikan oleh PT. Rafa Kreasindo Teknologi.',
};

export default function TermsPage() {
  return (
    <div className="font-sans text-slate-800 bg-white selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      <PublicHeader />

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

      <PublicFooter />
    </div>
  );
}
