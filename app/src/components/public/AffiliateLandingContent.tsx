'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Users,
  Building2,
  CreditCard,
  FileText,
  Clock,
  ChevronRight,
  Coins,
  Loader2,
  Check,
  HelpCircle,
  Briefcase,
  Award,
  Share2,
} from 'lucide-react';
import { registerAffiliateAction } from '@/actions/affiliateActions';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export function AffiliateLandingContent() {
  // Calculator State
  const [referredClients, setReferredClients] = useState<number>(5);
  const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('PPJK / Bea Cukai');
  const [companyName, setCompanyName] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [preferredCode, setPreferredCode] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, startTransition] = useTransition();
  const [formResponse, setFormResponse] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    code?: string;
  } | null>(null);

  // Calculations
  const monthlyCommissionPerClient = 200000; // 20% of Rp 1.000.000
  const yearlyCommissionPerClient = 2000000; // 20% of Rp 10.000.000

  const calculatedMonthly = referredClients * monthlyCommissionPerClient;
  const calculatedYearly =
    planType === 'yearly'
      ? referredClients * yearlyCommissionPerClient
      : calculatedMonthly * 12;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormResponse(null);

    startTransition(async () => {
      const res = await registerAffiliateAction({
        fullName,
        email,
        phone,
        occupation,
        companyName,
        bankName,
        bankAccountNumber,
        bankAccountName,
        preferredCode,
        password,
      });

      setFormResponse(res);
      if (res.success) {
        setPassword('');
      }
    });
  };

  return (
    <div className="font-sans text-slate-800 bg-white selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* ══════════════════════════════════════════
          NAVBAR (Same as Landing Page)
      ══════════════════════════════════════════ */}
      <PublicHeader />

      {/* ══════════════════════════════════════════
          HERO BANNER (Blue-950 Gradient, Wave Separator)
      ══════════════════════════════════════════ */}
      <section className="relative pt-36 pb-24 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm font-semibold text-cyan-300 mb-6 shadow-sm">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Program Afiliasi B2B Logistik & Freight Forwarding
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Hasilkan Komisi Recurring{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
              20% Tiap Bulan
            </span>{' '}
            dari Klien Forwarder
          </h1>

          <p className="text-lg md:text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
            Rekomendasikan software operasional freight forwarding terlengkap (Job File, BL/AWB, e-Faktur & Bea Cukai) ke relasi bisnis Anda. Dapatkan komisi setiap bulan selama tenant berlangganan.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#daftar"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-xl shadow-cyan-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              Daftar Jadi Mitra Afiliator
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/affiliate/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/15 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              Sudah Terdaftar? Masuk Portal
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </Link>
          </div>

          {/* Highlights row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-4xl mx-auto text-left">
            {[
              {
                title: 'Komisi 20% Berulang',
                desc: 'Rp 200.000/bln per tenant atau Rp 2.000.000/thn',
                icon: TrendingUp,
              },
              {
                title: 'Cookie 60-90 Hari',
                desc: 'Atribusi tersimpan aman lintas seluruh subdomain',
                icon: Clock,
              },
              {
                title: 'QRIS BorderPay Otomatis',
                desc: 'Invoice lunas, saldo komisi langsung masuk seketika',
                icon: CreditCard,
              },
              {
                title: 'Tanpa Modal & Transparan',
                desc: 'Pantau klik, tenant, dan ajukan tarik dana 24/7',
                icon: ShieldCheck,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-md"
              >
                <item.icon className="w-5 h-5 text-cyan-400 mb-2" />
                <h4 className="font-bold text-white text-sm">{item.title}</h4>
                <p className="text-xs text-blue-200/75 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave separator to white body */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12">
            <path d="M0,60 C360,10 1080,10 1440,60 L1440,60 L0,60 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SIMULASI KALKULATOR KOMISI
      ══════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <Coins className="w-3.5 h-3.5 text-blue-600" />
            <span>Kalkulator Proyeksi Pendapatan</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Hitung Potensi Passive Income Anda
          </h2>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Geser jumlah perusahaan forwarder yang Anda referensikan untuk melihat estimasi komisi.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Jumlah Forwarder yang Direferensikan:
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={referredClients}
                  onChange={(e) => setReferredClients(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-3xl font-black text-blue-600 w-12 text-right">
                  {referredClients}
                </span>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Skema Paket Langganan Klien:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlanType('monthly')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                      planType === 'monthly'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Paket Bulanan (Rp 1 Juta/bln)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanType('yearly')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                      planType === 'yearly'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Paket Tahunan (Rp 10 Juta/thn)
                  </button>
                </div>
              </div>

              <div className="mt-6 text-xs text-slate-500 space-y-2 border-t border-slate-200 pt-4">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Komisi dihitung 20% bersih dari setiap invoice pembayaran tenant.
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Berlaku berulang (*recurring*) selama 12 bulan pertama tiap klien.
                </p>
              </div>
            </div>

            {/* Result Box */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
              <p className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
                Estimasi Penghasilan Afiliasi
              </p>

              <div className="mt-4">
                <p className="text-xs text-blue-200/80">Komisi Bulanan:</p>
                <p className="text-3xl sm:text-4xl font-black text-white mt-0.5">
                  Rp {calculatedMonthly.toLocaleString('id-ID')}
                  <span className="text-sm font-normal text-blue-200"> / bulan</span>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-800/80">
                <p className="text-xs text-blue-200/80">Total Proyeksi 1 Tahun (12 Bulan):</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
                  Rp {calculatedYearly.toLocaleString('id-ID')}
                </p>
              </div>

              <a
                href="#daftar"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all shadow-md shadow-cyan-400/20"
              >
                Klaim Kode Referral Anda Sekarang &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SIAPA SAJA YANG COCOK BERGABUNG
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekosistem Saling Terhubung</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Siapa yang Paling Cocok Menjadi Mitra Afiliasi?
            </h2>
            <p className="text-slate-500 mt-3 text-sm sm:text-base">
              Industri logistik di Indonesia sangat erat mengandalkan jaringan saling percaya (*word-of-mouth*). Rekomendasi Anda bernilai tinggi bagi rekanan forwarder.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Staf & Petugas PPJK (Bea Cukai)',
                desc: 'Anda yang setiap hari berkoordinasi dengan staf operasional forwarder di Tanjung Priok, Tanjung Perak, atau bandara. Saat mereka butuh software untuk mempercepat proses BL, PEB/PIB, dan manifes, rekomendasikan sistemforwarding.com.',
                badge: 'Konversi Tinggi',
                icon: Briefcase,
              },
              {
                title: 'Konsultan Pajak & Akuntan Logistik',
                desc: 'Forwarder sering pusing menghitung PPN PMK 71 (1.1%), PPh 23, dan pelaporan e-Faktur. sistemforwarding.com sudah otomatis menghitung pajak logistik secara presisi. Klien Anda lebih tertib, Anda mendapat komisi tiap bulan.',
                badge: 'Sinergi Layanan',
                icon: FileText,
              },
              {
                title: 'Agen Asuransi Kargo & Praktisi Forwarding',
                desc: 'Anda yang menjual asuransi marine cargo, pemilik armada trucking, atau mantan forwarder. Bantu rekanan Anda beralih dari Excel manual yang rawan selip ke sistem Cloud SaaS modern.',
                badge: 'Jaringan Bisnis',
                icon: Award,
              },
            ].map((card, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-xl hover:border-blue-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <card.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FORMULIR PENDAFTARAN AFILIATOR
      ══════════════════════════════════════════ */}
      <section id="daftar" className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Formulir Pendaftaran Mitra</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Bergabung Sebagai Mitra Afiliasi
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Isi data diri dan rekening bank untuk pencairan komisi Anda. Permohonan akan diverifikasi oleh Super Admin dalam 1x24 jam.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl">
          {formResponse?.success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Pendaftaran Berhasil!</h3>
              <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
                Kode referral usulan Anda:{' '}
                <strong className="text-blue-600 font-mono text-base">{formResponse.code}</strong>. Permohonan Anda telah masuk ke tim Super Admin untuk verifikasi. Kami juga telah mengirimkan konfirmasi via WhatsApp ke nomor Anda.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/affiliate/login"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-md"
                >
                  Masuk ke Portal Afiliasi
                </Link>
                <button
                  type="button"
                  onClick={() => setFormResponse(null)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                >
                  Daftar Akun Lain
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {formResponse?.error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formResponse.error}
                </div>
              )}

              {/* Section 1: Profil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Prasetyo"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Alamat Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    No. WhatsApp Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Untuk notifikasi komisi instan saat invoice lunas.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Profesi / Latar Belakang *
                  </label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="PPJK / Bea Cukai">Staf / Agen PPJK (Bea Cukai)</option>
                    <option value="Konsultan Pajak & Keuangan">Konsultan Pajak & Keuangan Logistik</option>
                    <option value="Agen Asuransi Kargo">Agen Asuransi Marine & Kargo</option>
                    <option value="Praktisi / Mantan Forwarder">Praktisi / Pengusaha Freight Forwarding</option>
                    <option value="Vendor Trucking / Depo">Vendor Trucking / Depo / Pelabuhan</option>
                    <option value="Lainnya">Lainnya / Profesional B2B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Perusahaan / Instansi (Opsional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Contoh: PT Global PPJK Mandiri / Kantor Konsultan Pajak"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Section 2: Rekening Bank */}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                  Informasi Rekening Bank Pencairan Komisi
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-semibold">Bank Tujuan *</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    >
                      <option value="BCA">BCA</option>
                      <option value="MANDIRI">Bank Mandiri</option>
                      <option value="BRI">BRI</option>
                      <option value="BNI">BNI</option>
                      <option value="BSI">BSI</option>
                      <option value="CIMB">CIMB Niaga</option>
                      <option value="PERMATA">Permata</option>
                      <option value="JAGO">Bank Jago</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-semibold">Nomor Rekening *</label>
                    <input
                      type="text"
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Contoh: 1234567890"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-semibold">Nama Pemilik Rekening *</label>
                    <input
                      type="text"
                      required
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Sesuai buku tabungan"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 uppercase focus:outline-none focus:border-blue-600 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Kode Referral & Password Portal */}
              <div className="pt-3 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Usulan Kode Referral Unik *
                    </label>
                    <input
                      type="text"
                      required
                      value={preferredCode}
                      onChange={(e) => setPreferredCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: PRIOK20, CATUR20"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-mono font-bold focus:outline-none focus:border-blue-600"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Link Anda: sistemforwarding.com/?ref={preferredCode || 'KODE'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Password Portal Afiliasi *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Digunakan untuk login ke portal dashboard mitra.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-600/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mendaftarkan Kemitraan...
                    </>
                  ) : (
                    <>
                      Kirim Pendaftaran Mitra Afiliasi
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-3">
                  Dengan mendaftar, Anda menyetujui syarat & ketentuan program kemitraan sistemforwarding.com.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ SECTION
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Berapa lama masa berlaku tracking cookie referral?',
                a: 'Cookie disimpan selama 60 hingga 90 hari lintas seluruh subdomain (*.sistemforwarding.com). Jika calon klien Anda klik link hari ini dan baru memutuskan berlangganan bulan depan, komisi tetap 100% diatribusikan ke akun Anda.',
              },
              {
                q: 'Kapan dan bagaimana komisi dicairkan?',
                a: 'Komisi otomatis tercatat setiap kali tenant membayar tagihan via BorderPay QRIS. Anda dapat mengajukan penarikan dana (minimal Rp 200.000) kapan saja dari Portal Afiliasi langsung ke rekening BCA, Mandiri, BRI, atau bank nasional lainnya.',
              },
              {
                q: 'Apakah ada batasan jumlah klien yang bisa saya referensikan?',
                a: 'Sama sekali tidak ada batasan. Semakin banyak forwarder yang Anda bawa, semakin besar pendapatan pasif bulanan Anda.',
              },
              {
                q: 'Bagaimana jika klien mendaftar langsung tanpa klik link?',
                a: 'Klien tetap bisa memasukkan kode referral unik Anda secara manual pada kolom "Kode Referral / Mitra" di halaman pendaftaran /onboarding.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 text-base mb-2 flex items-start gap-2.5">
                  <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER (Same as Landing Page)
      ══════════════════════════════════════════ */}
      <PublicFooter />
    </div>
  );
}
