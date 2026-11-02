"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  MessageCircle,
  Building2,
  Receipt,
  Search,
  Filter,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  approveAffiliateAction,
  rejectAffiliateAction,
  processPayoutAction,
} from "@/actions/affiliateActions";

interface AdminAffiliatesManagerProps {
  initialData: {
    summary: {
      totalAffiliates: number;
      activeAffiliates: number;
      pendingApplications: number;
      totalCommissionsPaid: number;
      pendingPayoutsCount: number;
      pendingPayoutsAmount: number;
    };
    affiliates: Array<{
      id: string;
      code: string;
      fullName: string;
      email: string;
      phone: string;
      occupation: string | null;
      companyName: string | null;
      bankName: string;
      bankAccountNumber: string;
      bankAccountName: string;
      commissionRate: number;
      status: string;
      totalClicks: number;
      totalReferred: number;
      activeReferred: number;
      totalEarned: number;
      availableBalance: number;
      createdAt: string;
    }>;
    payouts: Array<{
      id: string;
      affiliateId: string;
      affiliateName: string;
      affiliateCode: string;
      affiliatePhone: string;
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
    commissions: Array<{
      id: string;
      affiliateName: string;
      affiliateCode: string;
      tenantName: string;
      tenantSubdomain: string;
      invoiceAmount: number;
      commissionAmount: number;
      status: string;
      notes: string | null;
      createdAt: string;
    }>;
  };
}

export function AdminAffiliatesManager({ initialData }: AdminAffiliatesManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "payouts" | "commissions">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Approval Modal State
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [customCode, setCustomCode] = useState("");
  const [customRate, setCustomRate] = useState(20);

  // Reject Modal State
  const [rejectingAffiliate, setRejectingAffiliate] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Payout Process Modal State
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [payoutNotes, setPayoutNotes] = useState("");

  const pendingAffiliates = initialData.affiliates.filter((a) => a.status === "PENDING");
  const activeAffiliates = initialData.affiliates.filter((a) => a.status === "APPROVED");
  const pendingPayouts = initialData.payouts.filter((p) => p.status === "PENDING");

  const handleApprove = () => {
    if (!selectedAffiliate) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await approveAffiliateAction(selectedAffiliate.id, customCode || undefined, customRate);
      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Afiliator berhasil disetujui." });
        setSelectedAffiliate(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Gagal menyetujui." });
      }
    });
  };

  const handleReject = () => {
    if (!rejectingAffiliate) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await rejectAffiliateAction(rejectingAffiliate.id, rejectReason);
      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Afiliator ditolak." });
        setRejectingAffiliate(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Gagal menolak." });
      }
    });
  };

  const handleProcessPayout = (action: "APPROVE" | "REJECT") => {
    if (!selectedPayout) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await processPayoutAction(selectedPayout.id, action, payoutNotes);
      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Penarikan berhasil diproses." });
        setSelectedPayout(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.error || "Gagal memproses penarikan." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            Manajemen Program Afiliasi & Mitra B2B
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Kelola permohonan mitra afiliasi, pantau atribusi tenant baru, dan setujui penarikan dana komisi.
          </p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mitra Aktif</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {initialData.summary.activeAffiliates}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Dari total {initialData.summary.totalAffiliates} pendaftar
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Menunggu Approval</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {initialData.summary.pendingApplications}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Permohonan perlu diverifikasi</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Komisi Cair</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            Rp {initialData.summary.totalCommissionsPaid.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dihasilkan dari invoice SaaS</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Antrean Penarikan</span>
            <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Rp {initialData.summary.pendingPayoutsAmount.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {initialData.summary.pendingPayoutsCount} permintaan menunggu transfer
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-4 overflow-x-auto">
          {[
            {
              id: "pending",
              label: `Permohonan Baru (${pendingAffiliates.length})`,
              badge: pendingAffiliates.length > 0,
            },
            { id: "active", label: `Mitra Aktif (${activeAffiliates.length})` },
            {
              id: "payouts",
              label: `Antrean Tarik Dana (${pendingPayouts.length})`,
              badge: pendingPayouts.length > 0,
            },
            { id: "commissions", label: `Log Komisi Realtime (${initialData.commissions.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: PENDING APPLICATIONS */}
        {activeTab === "pending" && (
          <div className="mt-6">
            {pendingAffiliates.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                Tidak ada permohonan mitra afiliasi baru yang menunggu verifikasi.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Nama / Perusahaan</th>
                      <th className="pb-3 font-semibold">Profesi / Kontak</th>
                      <th className="pb-3 font-semibold">Usulan Kode</th>
                      <th className="pb-3 font-semibold">Rekening Pencairan</th>
                      <th className="pb-3 font-semibold">Tgl Daftar</th>
                      <th className="pb-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {pendingAffiliates.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-zinc-850/50">
                        <td className="py-4">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{a.fullName}</p>
                          <p className="text-[11px] text-slate-400">{a.companyName || "-"}</p>
                        </td>
                        <td className="py-4">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[10px] font-bold mb-1">
                            {a.occupation || "Umum"}
                          </span>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span>{a.email}</span>
                          </p>
                          <a
                            href={`https://wa.me/${a.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <MessageCircle className="w-3 h-3" />
                            {a.phone}
                          </a>
                        </td>
                        <td className="py-4">
                          <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                            {a.code}
                          </span>
                        </td>
                        <td className="py-4 text-slate-700 dark:text-zinc-300">
                          <p className="font-semibold">{a.bankName} - {a.bankAccountNumber}</p>
                          <p className="text-[11px] text-slate-400">a/n {a.bankAccountName}</p>
                        </td>
                        <td className="py-4 text-slate-400">
                          {new Date(a.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedAffiliate(a);
                                setCustomCode(a.code);
                                setCustomRate(a.commissionRate || 20);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Setujui
                            </button>
                            <button
                              onClick={() => setRejectingAffiliate(a)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE AFFILIATES */}
        {activeTab === "active" && (
          <div className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Nama / Kontak</th>
                    <th className="pb-3 font-semibold">Kode & Komisi</th>
                    <th className="pb-3 font-semibold">Klien Diperoleh</th>
                    <th className="pb-3 font-semibold">Total Komisi</th>
                    <th className="pb-3 font-semibold">Saldo Tersedia</th>
                    <th className="pb-3 font-semibold">Rekening Bank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {activeAffiliates.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-zinc-850/50">
                      <td className="py-4">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{a.fullName}</p>
                        <p className="text-[11px] text-slate-400">{a.occupation || "-"}</p>
                        <a
                          href={`https://wa.me/${a.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <MessageCircle className="w-3 h-3" />
                          {a.phone}
                        </a>
                      </td>
                      <td className="py-4">
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 block">
                          {a.code}
                        </span>
                        <span className="text-[10px] text-slate-400">{a.commissionRate}% Recurring</span>
                      </td>
                      <td className="py-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {a.totalReferred} Tenant
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {a.activeReferred} Aktif Berlangganan
                        </p>
                      </td>
                      <td className="py-4 font-mono font-bold text-slate-900 dark:text-white">
                        Rp {a.totalEarned.toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        Rp {a.availableBalance.toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 text-slate-600 dark:text-zinc-300">
                        <p className="font-semibold">{a.bankName} - {a.bankAccountNumber}</p>
                        <p className="text-[11px] text-slate-400">a/n {a.bankAccountName}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PAYOUT QUEUE */}
        {activeTab === "payouts" && (
          <div className="mt-6">
            {initialData.payouts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                Belum ada permohonan penarikan dana dari afiliator.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Afiliator</th>
                      <th className="pb-3 font-semibold">Nominal Tarik</th>
                      <th className="pb-3 font-semibold">Rekening Transfer</th>
                      <th className="pb-3 font-semibold">Tgl Pengajuan</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {initialData.payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-850/50">
                        <td className="py-4">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{p.affiliateName}</p>
                          <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                            {p.affiliateCode}
                          </span>
                        </td>
                        <td className="py-4 font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                          Rp {p.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="py-4 text-slate-700 dark:text-zinc-300">
                          <p className="font-semibold">{p.bankName} - {p.bankAccountNumber}</p>
                          <p className="text-[11px] text-slate-400">a/n {p.bankAccountName}</p>
                        </td>
                        <td className="py-4 text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              p.status === "PAID"
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                                : p.status === "REJECTED"
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                                : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {p.status === "PENDING" && (
                            <button
                              onClick={() => {
                                setSelectedPayout(p);
                                setPayoutNotes("");
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer"
                            >
                              Proses Transfer
                            </button>
                          )}
                          {p.status === "PAID" && (
                            <span className="text-[11px] text-slate-400">Selesai Ditransfer</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REALTIME COMMISSIONS */}
        {activeTab === "commissions" && (
          <div className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Tgl Invoice</th>
                    <th className="pb-3 font-semibold">Afiliator Penerima</th>
                    <th className="pb-3 font-semibold">Tenant Pelunasan</th>
                    <th className="pb-3 font-semibold">Nilai Tagihan</th>
                    <th className="pb-3 font-semibold">Komisi (20%)</th>
                    <th className="pb-3 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {initialData.commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-zinc-850/50">
                      <td className="py-3.5 text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white">{c.affiliateName}</p>
                        <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                          {c.affiliateCode}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-800 dark:text-zinc-200 font-medium">
                        {c.tenantName} ({c.tenantSubdomain})
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-zinc-400">
                        Rp {c.invoiceAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        + Rp {c.commissionAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 text-slate-400">{c.notes || "SaaS Subscription"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* APPROVAL MODAL */}
      {selectedAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Persetujuan Akun Afiliasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Menyetujui <strong>{selectedAffiliate.fullName}</strong> ({selectedAffiliate.occupation || "Umum"}). Notifikasi WhatsApp akan otomatis dikirimkan ke <strong>{selectedAffiliate.phone}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Kode Referral Final
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono font-bold uppercase text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Persentase Komisi Recurring (%)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={customRate}
                onChange={(e) => setCustomRate(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAffiliate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApprove}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Aktifkan & Kirim WA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">
              Tolak Permohonan Afiliasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Tolak pendaftaran <strong>{rejectingAffiliate.fullName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Alasan Penolakan (Opsional)
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Tidak dapat dihubungi / bukan praktisi logistik"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingAffiliate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReject}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                Tolak Afiliator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYOUT PROCESS MODAL */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Konfirmasi Transfer Komisi
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1 text-xs">
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                Jumlah: Rp {selectedPayout.amount.toLocaleString("id-ID")}
              </p>
              <p className="text-slate-600 dark:text-zinc-300">
                Penerima: {selectedPayout.bankName} - {selectedPayout.bankAccountNumber}
              </p>
              <p className="text-slate-400">a/n {selectedPayout.bankAccountName}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Catatan / No. Referensi Transfer Bank (Opsional)
              </label>
              <input
                type="text"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder="Contoh: Trf via KlikBCA Ref #9872134"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleProcessPayout("APPROVE")}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Tandai Lunas & Kirim WA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
