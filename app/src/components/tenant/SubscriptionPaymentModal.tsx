"use client";

import { useState, useEffect, useTransition } from "react";
import QRCode from "qrcode";
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  createTenantRenewalInvoiceAction,
  checkTenantPaymentStatusAction,
  TenantSubscriptionInfo,
} from "@/actions/tenantSubscriptionActions";

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subdomain: string;
  subscriptionInfo: TenantSubscriptionInfo | null;
  onSuccess?: () => void;
}

export function SubscriptionPaymentModal({
  isOpen,
  onClose,
  subdomain,
  subscriptionInfo,
  onSuccess,
}: SubscriptionPaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"MONTHLY" | "YEARLY">(
    subscriptionInfo?.billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY"
  );
  const [isPending, startTransition] = useTransition();
  const [invoiceData, setInvoiceData] = useState<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    qrisString: string | null;
  } | null>(null);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Inisialisasi jika ada pending invoice
  useEffect(() => {
    if (subscriptionInfo?.pendingInvoice) {
      setInvoiceData({
        id: subscriptionInfo.pendingInvoice.id,
        invoiceNumber: subscriptionInfo.pendingInvoice.invoiceNumber,
        totalAmount: subscriptionInfo.pendingInvoice.totalAmount,
        qrisString: subscriptionInfo.pendingInvoice.qrisString,
      });
    }
  }, [subscriptionInfo]);

  // Generate QR image when qrisString is available
  useEffect(() => {
    let isMounted = true;
    if (invoiceData?.qrisString) {
      QRCode.toDataURL(invoiceData.qrisString, {
        width: 256,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => {
          if (isMounted) setQrCodeDataUrl(url);
        })
        .catch((err) => {
          console.error("[SubscriptionPaymentModal] QR error:", err);
        });
    } else {
      setQrCodeDataUrl(null);
    }
    return () => {
      isMounted = false;
    };
  }, [invoiceData?.qrisString]);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateInvoice = () => {
    startTransition(async () => {
      setFeedback(null);
      const res = await createTenantRenewalInvoiceAction({
        subdomain,
        planCode: selectedPlan,
      });

      if (res.success && res.invoiceId) {
        setInvoiceData({
          id: res.invoiceId,
          invoiceNumber: res.invoiceNumber!,
          totalAmount: res.totalAmount!,
          qrisString: res.qrisString || null,
        });
      } else {
        setFeedback(res.message || "Gagal membuat invoice perpanjangan.");
      }
    });
  };

  const handleCheckPayment = async () => {
    if (!invoiceData?.id || isCheckingPayment) return;
    setIsCheckingPayment(true);
    setFeedback(null);

    try {
      const res = await checkTenantPaymentStatusAction(invoiceData.id);
      if (res.isPaid) {
        setPaymentSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setFeedback(res.message);
      }
    } catch {
      setFeedback("Gagal memeriksa status pembayaran. Silakan coba lagi.");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const monthlyPrice = 1000000;
  const yearlyPrice = 10000000; // Diskon 2 bulan
  const activePrice = selectedPlan === "YEARLY" ? yearlyPrice : monthlyPrice;
  const taxAmount = Math.round(activePrice * 0.011); // PPN 1.1%
  const grandTotal = activePrice + taxAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 dark:text-slate-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Perpanjangan Langganan SaaS
              </h3>
              <p className="text-xs text-white/80">
                Ruang Kerja: <strong className="text-white">{subdomain}.sistemforwarding.com</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {paymentSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Pembayaran Berhasil!
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-xs max-w-sm mx-auto leading-relaxed">
                Masa langganan cloud forwarder Anda telah berhasil diperpanjang. Seluruh modul dan dokumen kargo aktif penuh.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.reload();
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Kembali ke Dashboard
                </button>
              </div>
            </div>
          ) : invoiceData ? (
            /* QRIS & Payment Screen */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    No. Invoice SaaS
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                    {invoiceData.invoiceNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Total Bayar (PPN 1.1%)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm text-indigo-600 dark:text-indigo-400">
                    Rp {invoiceData.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* QRIS Box */}
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-3xl p-5 text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <QrCode className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span>Scan QRIS Resmi (BorderPay)</span>
                </div>

                {qrCodeDataUrl ? (
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-md border border-slate-200">
                    <img
                      src={qrCodeDataUrl}
                      alt="QRIS Payment"
                      className="w-48 h-48 object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                    Memuat QRIS...
                  </div>
                )}

                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Scan via <strong>BCA Mobile, Livin Mandiri, BRImo, GoPay, OVO, ShopeePay, Dana</strong>, atau aplikasi mobile banking apa pun.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCheckPayment}
                  disabled={isCheckingPayment}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isCheckingPayment ? "animate-spin" : ""}`} />
                  <span>{isCheckingPayment ? "Memeriksa Pembayaran..." : "Saya Sudah Bayar (Cek Status)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInvoiceData(null)}
                  className="w-full py-2 px-3 text-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white text-[11px]"
                >
                  ← Pilih Paket / Durasi Lain
                </button>
              </div>

              {feedback && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{feedback}</span>
                </div>
              )}
            </div>
          ) : (
            /* Plan Selection Screen */
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Pilih Periode Langganan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Monthly Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("MONTHLY")}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPlan === "MONTHLY"
                        ? "border-violet-600 bg-violet-50/70 dark:bg-violet-950/40 shadow-sm"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 bg-white dark:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">Bulanan</span>
                      <span className="text-[10px] text-slate-400">Fleksibel</span>
                    </div>
                    <div className="text-base font-black text-violet-600 dark:text-violet-400">
                      Rp 1.000.000
                    </div>
                    <span className="text-[10px] text-slate-400">/ bulan + PPN</span>
                  </button>

                  {/* Yearly Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("YEARLY")}
                    className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      selectedPlan === "YEARLY"
                        ? "border-violet-600 bg-violet-50/70 dark:bg-violet-950/40 shadow-sm"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 bg-white dark:bg-white/[0.02]"
                    }`}
                  >
                    <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white shadow-2xs">
                      Hemat Rp 2 Juta
                    </span>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">Tahunan</span>
                      <Sparkles className="h-3 w-3 text-amber-500" />
                    </div>
                    <div className="text-base font-black text-violet-600 dark:text-violet-400">
                      Rp 10.000.000
                    </div>
                    <span className="text-[10px] text-slate-400">/ tahun (12 bulan)</span>
                  </button>
                </div>
              </div>

              {/* Breakdown Biaya */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                  Rincian Pembayaran Resmi
                </span>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Biaya Langganan ({selectedPlan === "YEARLY" ? "12 Bulan" : "1 Bulan"})</span>
                  <span className="font-mono">Rp {activePrice.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>PPN 1.1% (PMK 71/2022)</span>
                  <span className="font-mono">Rp {taxAmount.toLocaleString("id-ID")}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                  <span>Total Tagihan</span>
                  <span className="font-mono text-violet-600 dark:text-violet-400 font-black">
                    Rp {grandTotal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleGenerateInvoice}
                disabled={isPending}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isPending ? "Menerbitkan QRIS..." : "Lanjutkan Pembayaran via QRIS BorderPay"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Pembayaran aman otomatis terverifikasi secara instan</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
