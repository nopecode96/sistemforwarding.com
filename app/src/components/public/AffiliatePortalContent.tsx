"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  CreditCard,
  ArrowUpRight,
  Clock,
  LogOut,
  AlertCircle,
  Loader2,
  FileText,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Download,
  Info,
  Layers,
} from "lucide-react";
import {
  logoutAffiliateAction,
  requestAffiliatePayoutAction,
} from "@/actions/affiliateActions";

interface AffiliateDataProps {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  code: string;
  occupation: string | null;
  companyName: string | null;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  commissionRate: number;
  totalClicks: number;
  stats: {
    totalReferred: number;
    activePaying: number;
    totalEarned: number;
    totalPaidPayouts: number;
    pendingPayouts: number;
    availableBalance: number;
  };
  tenants: Array<{
    id: string;
    companyNameMasked: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    createdAt: string;
  }>;
  commissions: Array<{
    id: string;
    invoiceAmount: number;
    commissionAmount: number;
    status: string;
    notes: string | null;
    createdAt: string;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    status: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    notes: string | null;
    transferProofUrl: string | null;
    createdAt: string;
    processedAt: string | null;
  }>;
}

export function AffiliatePortalContent({
  initialData,
  rootDomain = "sistemforwarding.com",
}: {
  initialData: AffiliateDataProps;
  rootDomain?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<AffiliateDataProps>(initialData);
  const [activeTab, setActiveTab] = useState<"tenants" | "commissions" | "payouts" | "marketing">(
    "tenants"
  );
  const [copied, setCopied] = useState(false);

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(
    Math.min(data.stats.availableBalance, 1000000)
  );
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [isPendingPayout, startPayoutTransition] = useTransition();

  const referralLink = `https://${rootDomain}/?ref=${data.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `Halo Rekan Logistik! Coba software operasional freight forwarding terlengkap sistemforwarding.com (Job File, BL/AWB, e-Faktur & Bea Cukai). Dapatkan prioritas onboarding dan penawaran kemitraan eksklusif via link referral saya:\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleLogout = async () => {
    await logoutAffiliateAction();
    router.push("/affiliate/login");
    router.refresh();
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccess(null);

    startPayoutTransition(async () => {
      const res = await requestAffiliatePayoutAction(payoutAmount, payoutNotes);
      if (res.success) {
        setPayoutSuccess(res.message || "Pengajuan penarikan dana berhasil dikirim.");
        setTimeout(() => {
          setIsPayoutModalOpen(false);
          setPayoutSuccess(null);
          router.refresh();
        }, 2000);
      } else {
        setPayoutError(res.error || "Gagal mengajukan penarikan dana.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 pb-20">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-white text-lg tracking-tight">
              sistem<span className="text-cyan-400">forwarding</span>
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-bold">
              Konsol Afiliasi
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-white">{data.fullName}</p>
              <p className="text-[11px] text-slate-400">{data.occupation || "Mitra B2B"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Keluar dari Portal"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ==================================================================== */}
        {/* REFERRAL LINK BANNER */}
        {/* ==================================================================== */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Komisi Recurring: {data.commissionRate}% (12 Bulan)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Halo, {data.fullName.split(" ")[0]}!
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
                Bagikan tautan referral atau kode kupon Anda ke rekanan freight forwarder. Anda otomatis mendapatkan komisi 20% setiap kali mereka membayar invoice SaaS.
              </p>
            </div>

            {/* Link Box */}
            <div className="w-full lg:w-auto bg-slate-950/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="px-3 py-2 bg-slate-900 rounded-xl border border-slate-850 font-mono text-xs sm:text-sm text-cyan-300 font-bold truncate max-w-xs">
                {referralLink}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-400/20 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Tersalin!" : "Salin Link"}
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Bagikan ke WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* KPI CARDS */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {data.stats.totalReferred}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Tenant terdaftar via link Anda</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tenant Berlangganan</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {data.stats.activePaying}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Status langganan aktif</p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Komisi Masuk</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-white">
              Rp {data.stats.totalEarned.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Total akumulasi sepanjang waktu</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-800/40 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-cyan-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Saldo Siap Ditarik</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-cyan-300">
                Rp {data.stats.availableBalance.toLocaleString("id-ID")}
              </p>
            </div>
            <button
              onClick={() => setIsPayoutModalOpen(true)}
              disabled={data.stats.availableBalance < 200000}
              className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              Tarik Saldo Komisi &rarr;
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TABS & DETAILS TABLE */}
        {/* ==================================================================== */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
            {[
              { id: "tenants", label: `Klien Referensi (${data.tenants.length})` },
              { id: "commissions", label: `Riwayat Komisi (${data.commissions.length})` },
              { id: "payouts", label: `Riwayat Penarikan (${data.payouts.length})` },
              { id: "marketing", label: "Materi Promosi & Panduan" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: TENANTS */}
          {activeTab === "tenants" && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400">
                  Nama perusahaan disamarkan sebagian untuk menjaga privasi B2B ekosistem logistik.
                </p>
              </div>

              {data.tenants.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Belum ada klien yang mendaftar melalui link referral Anda. Bagikan tautan ke rekanan forwarder Anda!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Nama Forwarder</th>
                        <th className="pb-3 font-semibold">Paket</th>
                        <th className="pb-3 font-semibold">Status Langganan</th>
                        <th className="pb-3 font-semibold">Tanggal Daftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.tenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-850/50">
                          <td className="py-3.5 font-bold text-white font-mono">
                            {t.companyNameMasked}
                          </td>
                          <td className="py-3.5 text-slate-300 uppercase">{t.subscriptionTier}</td>
                          <td className="py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                t.subscriptionStatus === "ACTIVE"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : "bg-amber-950 text-amber-400 border border-amber-800"
                              }`}
                            >
                              {t.subscriptionStatus}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-400">
                            {new Date(t.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMMISSIONS */}
          {activeTab === "commissions" && (
            <div className="mt-6">
              {data.commissions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Belum ada komisi masuk. Komisi otomatis bertambah begitu invoice pembayaran langganan tenant terverifikasi via BorderPay QRIS.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Tanggal</th>
                        <th className="pb-3 font-semibold">Nilai Tagihan Tenant</th>
                        <th className="pb-3 font-semibold">Komisi Anda (20%)</th>
                        <th className="pb-3 font-semibold">Keterangan</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.commissions.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-850/50">
                          <td className="py-3.5 text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 text-slate-300">
                            Rp {c.invoiceAmount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 font-bold text-emerald-400 font-mono">
                            + Rp {c.commissionAmount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 text-slate-400">{c.notes || "Recurring Commission"}</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              LUNAS DITAMBAHKAN
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYOUTS */}
          {activeTab === "payouts" && (
            <div className="mt-6">
              {data.payouts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Belum ada riwayat penarikan dana. Klik &quot;Tarik Saldo Komisi&quot; di atas saat saldo Anda sudah mencapai minimal Rp 200.000.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Tanggal Pengajuan</th>
                        <th className="pb-3 font-semibold">Jumlah Penarikan</th>
                        <th className="pb-3 font-semibold">Rekening Tujuan</th>
                        <th className="pb-3 font-semibold">Status Pencairan</th>
                        <th className="pb-3 font-semibold">Catatan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-850/50">
                          <td className="py-3.5 text-slate-400">
                            {new Date(p.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 font-bold text-white font-mono">
                            Rp {p.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 text-slate-300">
                            {p.bankName} - {p.bankAccountNumber} ({p.bankAccountName})
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                p.status === "PAID"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : p.status === "REJECTED"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : "bg-amber-950 text-amber-400 border border-amber-800"
                              }`}
                            >
                              {p.status === "PAID"
                                ? "SUDAH DITRANSFER"
                                : p.status === "REJECTED"
                                ? "DITOLAK"
                                : "SEDANG DIPROSES ADMIN"}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-400">{p.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MARKETING KIT */}
          {activeTab === "marketing" && (
            <div className="mt-6 space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Tips Sukses Merekomendasikan ke Forwarder Rekanan:
                </h4>
                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-5 leading-relaxed">
                  <li>
                    <strong>Soroti Masalah Pajak:</strong> Forwarder sering pusing dengan perhitungan PPN PMK 71 1.1% dan pemotongan PPh 23. Beri tahu mereka sistemforwarding.com sudah otomatis menghitung ini di invoice dan terintegrasi e-Faktur.
                  </li>
                  <li>
                    <strong>Otomasi Operasional:</strong> Dari Job File otomatis generate Booking Confirmation, Bill of Lading (BL), Airway Bill (AWB), hingga Delivery Order (DO) tanpa copy-paste Excel berulang.
                  </li>
                  <li>
                    <strong>Free Trial 7 Hari Tanpa Kartu Kredit:</strong> Ajak mereka mencoba langsung ruang kerja operasional di <code>sistemforwarding.com/onboarding</code>.
                  </li>
                </ul>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white text-xs">Brosur Pengenalan Fitur (PDF)</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ringkasan lengkap fitur sistemforwarding.com</p>
                  </div>
                  <Link
                    href="/about"
                    target="_blank"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </Link>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white text-xs">Akses Ruang Kerja Live Demo</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tunjukkan dashboard interaktif ke calon klien</p>
                  </div>
                  <a
                    href="https://demo1.sistemforwarding.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ==================================================================== */}
      {/* WITHDRAWAL MODAL */}
      {/* ==================================================================== */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Pengajuan Penarikan Saldo Komisi</h3>
            <p className="text-xs text-slate-400 mb-5">
              Dana akan ditransfer oleh Super Admin ke rekening bank terdaftar Anda.
            </p>

            {payoutError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {payoutError}
              </div>
            )}

            {payoutSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {payoutSuccess}
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Rekening Tujuan</p>
                <p className="font-bold text-white text-sm">
                  {data.bankName} - {data.bankAccountNumber}
                </p>
                <p className="text-xs text-slate-400">a/n {data.bankAccountName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nominal Penarikan (Rp) *
                </label>
                <input
                  type="number"
                  min={200000}
                  max={data.stats.availableBalance}
                  step={50000}
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-lg font-mono font-bold text-cyan-400 focus:outline-none focus:border-cyan-400"
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span>Min: Rp 200.000</span>
                  <span>Tersedia: Rp {data.stats.availableBalance.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-2">
                {[500000, 1000000, data.stats.availableBalance].map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPayoutAmount(preset)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-750 transition-colors"
                  >
                    {i === 2 ? "Tarik Semua" : `Rp ${(preset / 1000).toLocaleString()}rb`}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Catatan untuk Admin (Opsional)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Contoh: Pencairan komisi bulan ini"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isPendingPayout}
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPendingPayout || payoutAmount < 200000 || payoutAmount > data.stats.availableBalance}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isPendingPayout ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Pengajuan Penarikan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
