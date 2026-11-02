'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import {
  Search,
  Ship,
  Plane,
  Truck,
  Package,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  RotateCw,
  AlertCircle,
  Building2,
  ExternalLink,
} from 'lucide-react';

export interface TrackingData {
  trackingNumber: string;
  jobFileNumber: string;
  houseBillOfLading?: string | null;
  masterBillOfLading?: string | null;
  shippingInstructionNo?: string | null;
  customerRefNo?: string | null;
  transportMode: 'SEA' | 'AIR' | 'INLAND' | string;
  status: string;
  statusLabel: string;
  currentStep: number;
  carrierOrVessel: string;
  voyageOrFlightNo?: string | null;
  originPort: string;
  destinationPort: string;
  transitPort?: string | null;
  bookingDate?: string | Date | null;
  etd?: string | Date | null;
  atd?: string | Date | null;
  eta?: string | Date | null;
  ata?: string | Date | null;
  packages: {
    count: number;
    type: string;
    grossWeightKg?: number | null;
    volumeWeightCbm?: number | null;
    containerSummary?: string | null;
    commodity?: string | null;
  };
  milestones: Array<{
    step: number;
    title: string;
    desc: string;
    date: string | null;
    isCompleted: boolean;
    isCurrent: boolean;
  }>;
  company: {
    name: string;
    legalName?: string | null;
    logoUrl?: string | null;
    subdomain: string;
  };
}

interface TrackingWidgetViewProps {
  tenant: {
    companyName: string;
    legalName?: string | null;
    logoUrl?: string | null;
    subdomain: string;
  };
  initialData?: TrackingData | null;
  initialQuery?: string;
  isEmbed?: boolean;
}

export function TrackingWidgetView({
  tenant,
  initialData = null,
  initialQuery = '',
  isEmbed = false,
}: TrackingWidgetViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<TrackingData | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/${tenant.subdomain}/track?q=${encodeURIComponent(cleanQuery)}`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        setData(null);
        setErrorMessage(
          json.error || `Data kiriman dengan nomor "${cleanQuery}" tidak ditemukan.`
        );
      } else {
        setData(json.data);
        setErrorMessage(null);
      }
    } catch {
      setErrorMessage(
        'Gagal terhubung ke server pelacakan. Silakan periksa koneksi internet Anda.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  const formatDateTime = (dateVal?: string | Date | null) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateVal);
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'AIR':
        return <Plane className="w-5 h-5" />;
      case 'INLAND':
        return <Truck className="w-5 h-5" />;
      case 'SEA':
      default:
        return <Ship className="w-5 h-5" />;
    }
  };

  return (
    <div
      className={`w-full min-h-screen ${
        isEmbed ? 'p-2 sm:p-4 bg-transparent' : 'p-4 sm:p-8 bg-slate-50/70'
      } flex flex-col items-center justify-center font-sans text-slate-800`}
    >
      <div
        className={`w-full ${
          isEmbed ? 'max-w-4xl' : 'max-w-4xl shadow-xl'
        } bg-white rounded-3xl border border-slate-200/90 overflow-hidden transition-all duration-300`}
      >
        {/* White-Label Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              {tenant.logoUrl ? (
                <div className="h-11 w-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
                  <Image
                    src={tenant.logoUrl}
                    alt={tenant.companyName}
                    width={40}
                    height={40}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md shadow-blue-500/30">
                  {tenant.companyName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                  {tenant.companyName}
                </h1>
                <p className="text-xs text-blue-200/80 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live Cargo Tracking System</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-blue-200 border border-white/10">
                Official Tracker
              </span>
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="p-5 sm:p-7 bg-slate-50/50 border-b border-slate-100">
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Cari Berdasarkan No. B/L, No. AWB, No. Kontainer, atau No. Job:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Contoh: D1-EXP-2026-001, HAWB-2026-003, atau JF/2026/..."
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-5 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 shrink-0 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Lacak</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-7">
          {/* Error / Not Found Message */}
          {errorMessage && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3.5 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">{errorMessage}</p>
                <p className="text-xs text-rose-600/90 mt-1 leading-relaxed">
                  Periksa kembali nomor resi yang Anda masukkan atau hubungi staf operasional{' '}
                  <strong>{tenant.companyName}</strong> untuk konfirmasi data pengiriman.
                </p>
              </div>
            </div>
          )}

          {/* Initial State Prompt (No Search Yet) */}
          {!data && !errorMessage && (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Package className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">
                  Pelacakan Kargo Real-Time
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Masukkan nomor identitas kiriman kargo Anda (Nomor House B/L, Air Waybill, No.
                  Kontainer, atau No. Job File) untuk melihat status pergerakan barang.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-bold text-slate-600">
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80">
                  ⚓ Angkutan Laut (Ocean)
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80">
                  ✈️ Kargo Udara (Air)
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80">
                  🚛 Armada Darat (Trucking)
                </span>
              </div>
            </div>
          )}

          {/* Shipment Tracking Details */}
          {data && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Top Banner Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                    {getTransportIcon(data.transportMode)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {data.trackingNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(data.trackingNumber)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-200/70 transition-colors"
                        title="Salin Nomor Resi"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      Moda: {data.transportMode} Freight • No. Job: {data.jobFileNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-2xs ${
                      data.status === 'DELIVERED' || data.status === 'CLOSED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : data.status === 'IN_TRANSIT'
                        ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 animate-pulse'
                        : data.status === 'CUSTOMS_CLEARANCE'
                        ? 'bg-violet-100 text-violet-800 border border-violet-200'
                        : data.status === 'ARRIVED'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {data.statusLabel}
                  </span>
                </div>
              </div>

              {/* Visual Timeline Stepper */}
              <div className="py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Tahapan Perjalanan Kiriman:
                </p>
                <div className="relative">
                  {/* Desktop Step Bar */}
                  <div className="hidden md:grid grid-cols-5 gap-2 relative">
                    {data.milestones.map((m, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center relative group">
                        {/* Connecting Line */}
                        {idx < data.milestones.length - 1 && (
                          <div
                            className={`absolute top-4 left-1/2 w-full h-1 z-0 transition-all ${
                              data.milestones[idx + 1].isCompleted
                                ? 'bg-emerald-500'
                                : m.isCompleted
                                ? 'bg-blue-300'
                                : 'bg-slate-200'
                            }`}
                          />
                        )}

                        {/* Step Circle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs relative z-10 transition-all ${
                            m.isCompleted
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                              : m.isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-500/30 animate-pulse'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {m.isCompleted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span>{m.step}</span>
                          )}
                        </div>

                        {/* Title & Date */}
                        <div className="mt-2.5 space-y-0.5">
                          <p
                            className={`text-xs font-bold ${
                              m.isCompleted
                                ? 'text-slate-900'
                                : m.isCurrent
                                ? 'text-blue-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {m.title}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {m.date ? formatDate(m.date) : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile Vertical Stepper */}
                  <div className="md:hidden space-y-4 pl-2 border-l-2 border-blue-500/40 ml-4">
                    {data.milestones.map((m, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div
                          className={`absolute -left-[17px] top-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            m.isCompleted
                              ? 'bg-emerald-600 text-white'
                              : m.isCurrent
                              ? 'bg-blue-600 text-white ring-2 ring-blue-100 animate-pulse'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {m.isCompleted ? <Check className="w-3.5 h-3.5" /> : m.step}
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              m.isCompleted
                                ? 'text-slate-900'
                                : m.isCurrent
                                ? 'text-blue-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {m.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                          {m.date && (
                            <span className="inline-block text-[10px] font-mono font-bold text-slate-400 mt-1">
                              {formatDateTime(m.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Route & Schedule Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Routing Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Rute Pengiriman &amp; Carrier:
                  </span>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        A
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Pelabuhan / Kota Asal:</span>
                        <span className="font-bold text-slate-900">{data.originPort}</span>
                        <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                          ETD: {formatDate(data.etd)} {data.atd ? `(Aktual: ${formatDate(data.atd)})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                        B
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Pelabuhan / Kota Tujuan:</span>
                        <span className="font-bold text-slate-900">{data.destinationPort}</span>
                        <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                          ETA: {formatDate(data.eta)} {data.ata ? `(Aktual: ${formatDate(data.ata)})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Kapal / Penerbangan:</span>
                      <span className="font-bold text-slate-900">
                        {data.carrierOrVessel}{' '}
                        {data.voyageOrFlightNo ? `(${data.voyageOrFlightNo})` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cargo Specification Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Spesifikasi Muatan &amp; Kontainer:
                  </span>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">Total Muatan</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {data.packages.count} {data.packages.type}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">Berat Kotor (Gross)</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {data.packages.grossWeightKg
                          ? `${data.packages.grossWeightKg.toLocaleString('id-ID')} Kg`
                          : '-'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">Volume Kargo</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {data.packages.volumeWeightCbm
                          ? `${data.packages.volumeWeightCbm.toLocaleString('id-ID')} CBM`
                          : '-'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block">Jenis Komoditas</span>
                      <span className="font-bold text-slate-900 truncate block" title={data.packages.commodity || 'General Cargo'}>
                        {data.packages.commodity || 'General Cargo'}
                      </span>
                    </div>
                  </div>

                  {data.packages.containerSummary && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 text-xs">
                      <span className="text-[10px] text-slate-400 block">Identitas Kontainer:</span>
                      <span className="font-mono font-bold text-blue-700">
                        {data.packages.containerSummary}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 sm:px-7 py-3 bg-slate-100/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Sistem Pelacakan Kargo Resmi Terintegrasi • <strong>{tenant.companyName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Powered by SistemForwarding Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
