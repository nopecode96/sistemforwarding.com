"use client";

import { useState, useEffect } from "react";
import { AdminPlatformInvoice } from "@/actions/adminBillingActions";
import QRCode from "qrcode";
import {
  X,
  Receipt,
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  Copy,
  Check,
  QrCode,
} from "lucide-react";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: AdminPlatformInvoice | null;
  onOpenPaymentApproval?: (invoice: AdminPlatformInvoice) => void;
}

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  onOpenPaymentApproval,
}: InvoiceDetailModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (invoice?.qrisString) {
      QRCode.toDataURL(invoice.qrisString, {
        width: 256,
        margin: 2,
        color: {
          dark: "#09090b",
          light: "#ffffff",
        },
      })
        .then((url) => {
          if (active) setQrDataUrl(url);
        })
        .catch((err) => {
          console.warn("[InvoiceDetailModal] QRCode generation error:", err);
          if (active) setQrDataUrl(null);
        });
    } else {
      Promise.resolve().then(() => {
        if (active) setQrDataUrl(null);
      });
    }
    return () => {
      active = false;
    };
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            LUNAS (PAID)
          </span>
        );
      case "PENDING":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            MENUNGGU PEMBAYARAN
          </span>
        );
      case "EXPIRED":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            KEDALUWARSA (EXPIRED)
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5" />
            DIBATALKAN (VOID)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-zinc-800 text-zinc-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {invoice.invoiceNumber}
                </h3>
                <button
                  onClick={() => handleCopy(invoice.invoiceNumber, "invNum")}
                  className="p-1 rounded text-zinc-400 hover:text-white transition"
                  title="Salin Nomor Invoice"
                >
                  {copiedField === "invNum" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                Diterbitkan pada {new Date(invoice.createdAt).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(invoice.status)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Tenant & Plan Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                Informasi Pelanggan (Tenant)
              </span>
              <p className="text-sm font-bold text-white">{invoice.tenant.companyName}</p>
              <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{invoice.tenant.subdomain}.sistemforwarding.com</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Tier Aktif Saat Ini:{" "}
                <span className="font-semibold text-zinc-300">{invoice.tenant.subscriptionTier}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                Paket Langganan Platform
              </span>
              <p className="text-sm font-bold text-amber-400">{invoice.planName}</p>
              <p className="text-xs text-zinc-300 font-mono">Kode Tier: {invoice.planCode}</p>
              <p className="text-[11px] text-zinc-400">Periode: {invoice.billingPeriod}</p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
              Rincian Biaya
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-300">
                <span>Biaya Langganan ({invoice.billingPeriod})</span>
                <span className="font-mono">Rp {invoice.amount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                <span>Pajak Platform (Net/Inclusive)</span>
                <span className="font-mono">Rp {invoice.taxAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-bold text-white">
                <span>Total Pembayaran</span>
                <span className="text-base text-emerald-400 font-mono font-black">
                  Rp {invoice.totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & QRIS Section */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                Status Pembayaran & Gateway
              </span>
              {invoice.paymentMethod && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {invoice.paymentMethod}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
              <div>
                <p className="text-zinc-500">Jatuh Tempo Pembayaran:</p>
                <p className="text-zinc-200 font-mono font-semibold mt-0.5">
                  {new Date(invoice.dueDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">Tanggal Pelunasan:</p>
                <p className="text-zinc-200 font-mono font-semibold mt-0.5">
                  {invoice.paidAt
                    ? new Date(invoice.paidAt).toLocaleString("id-ID")
                    : "Belum dibayar"}
                </p>
              </div>

              {invoice.paymentReference && (
                <div className="sm:col-span-2">
                  <p className="text-zinc-500">Referensi Transaksi:</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-zinc-200 font-mono font-bold bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                      {invoice.paymentReference}
                    </span>
                    <button
                      onClick={() => handleCopy(invoice.paymentReference!, "refId")}
                      className="text-zinc-400 hover:text-white"
                      title="Salin Referensi"
                    >
                      {copiedField === "refId" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* QRIS Display for Pending Invoices */}
            {qrDataUrl && invoice.status === "PENDING" && (
              <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/50 p-4 rounded-xl">
                <div className="bg-white p-2.5 rounded-xl shrink-0 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="BorderPay QRIS" className="w-36 h-36" />
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-white">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Dynamic QRIS BorderPay</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Tenant dapat memindai QR code ini melalui aplikasi perbankan (BCA, Mandiri, BRI, BNI) atau e-wallet (GoPay, OVO, ShopeePay, Dana).
                  </p>
                  {invoice.qrisString && (
                    <button
                      onClick={() => handleCopy(invoice.qrisString!, "qrisPayload")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono transition"
                    >
                      {copiedField === "qrisPayload" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>QRIS String Disalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin String QRIS</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="pt-2 text-[11px]">
                <p className="text-zinc-500 font-semibold mb-1">Catatan Tambahan:</p>
                <p className="text-zinc-300 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800/80 font-mono whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition"
          >
            Tutup
          </button>

          {invoice.status === "PENDING" && onOpenPaymentApproval && (
            <button
              onClick={() => {
                onClose();
                onOpenPaymentApproval(invoice);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui Pembayaran (Lunas)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
