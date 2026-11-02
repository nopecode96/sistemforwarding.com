"use client";

import { useState, useTransition } from "react";
import {
  AdminPlatformInvoice,
  markPlatformInvoicePaid,
  ActionResult,
} from "@/actions/adminBillingActions";
import { X, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

interface InvoicePaymentApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: AdminPlatformInvoice | null;
  onSuccess: (updatedInvoiceId: string) => void;
}

export function InvoicePaymentApprovalModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: InvoicePaymentApprovalModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("MANUAL_TRANSFER");
  const [paymentReference, setPaymentReference] = useState(
    invoice ? `APP-${invoice.invoiceNumber}` : "MANUAL-APPROVAL"
  );
  const [extendDays, setExtendDays] = useState<number>(
    invoice?.planCode === "YEARLY" ? 365 : invoice?.planCode === "TRIAL" ? 7 : 30
  );
  const [approvalNotes, setApprovalNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    startTransition(async () => {
      const res: ActionResult = await markPlatformInvoicePaid(invoice.id, {
        paymentMethod,
        paymentReference: paymentReference.trim(),
        notes: approvalNotes.trim() || undefined,
        extendDays: extendDays > 0 ? extendDays : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal menyetujui pembayaran.");
      } else {
        onSuccess(invoice.id);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Konfirmasi & Setujui Pembayaran</h3>
              <p className="text-xs text-zinc-400 font-mono">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Invoice Summary Box */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Tenant:</span>
              <span className="text-white font-bold">{invoice.tenant.companyName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Paket Langganan:</span>
              <span className="text-amber-400 font-mono font-bold">
                {invoice.planName} ({invoice.planCode})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Total Nominal:</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                Rp {invoice.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Metode Pembayaran Rekonsiliasi <span className="text-amber-400">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-medium focus:border-emerald-500 focus:outline-none"
              required
            >
              <option value="MANUAL_TRANSFER">Transfer Bank Manual (BCA/Mandiri/BRI)</option>
              <option value="QRIS BorderPay">QRIS BorderPay Reconciliation</option>
              <option value="VIRTUAL_ACCOUNT">Virtual Account Perbankan</option>
              <option value="ADMIN_COMPLIMENTARY">Complimentary / Diskon Khusus Internal</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Reference */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Ref. Transaksi / Bukti Transfer
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Nomor referensi bank..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Extension Days */}
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                Durasi Tambahan (Hari)
              </label>
              <input
                type="number"
                min={1}
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Catatan Persetujuan</label>
            <textarea
              rows={2}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Catatan pelunasan invoice ini..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Operational Impact Notice */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            <div>
              <p className="font-bold">Otomatisasi Sistem Forwarding:</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                Menyetujui invoice ini akan otomatis mengubah status tenant menjadi <strong>ACTIVE</strong>, menyelaraskan tier ke <strong>{invoice.planCode}</strong>, dan memperpanjang masa aktif sebesar <strong>+{extendDays} hari</strong>.
              </p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isPending ? "Memproses..." : "Setujui & Lunaskan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
