"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createJobFile, CreateJobFileResult, InitialJobFormData } from "@/actions/jobActions";
import Link from "next/link";
import {
  Ship,
  Calendar,
  Building,
  Anchor,
  Plane,
  Truck,
  Package,
  Layers,
  Scale,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Sparkles,
  UserCheck,
  MapPin,
  Box,
  Compass,
  CreditCard,
  FileCheck,
} from "lucide-react";
import { SearchableSelect, SearchOption } from "@/components/ui/SearchableSelect";

interface NewJobFileFormProps {
  initialData: InitialJobFormData;
}

export function NewJobFileForm({ initialData }: NewJobFileFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<CreateJobFileResult | null, FormData>(
    createJobFile,
    null
  );

  const {
    tenant,
    customers,
    vendors,
    dictionaries,
    previewJobNumber,
    ports = [],
    currencies = [],
    units = [],
    itemTypes = [],
    commodities = [],
    provinces = [],
  } = initialData;
  const today = new Date().toISOString().split("T")[0];

  // Interactive state for cargo dimensions & volumetric weight calculation
  const [cargoLength, setCargoLength] = useState<number>(40);
  const [cargoWidth, setCargoWidth] = useState<number>(26);
  const [cargoHeight, setCargoHeight] = useState<number>(35);
  const [packageCount, setPackageCount] = useState<number>(24);
  const [selectedTransportMode, setSelectedTransportMode] = useState<string>("AIR");

  const computedCbm = useMemo(() => {
    if (!cargoLength || !cargoWidth || !cargoHeight || !packageCount) return 0;
    return (cargoLength * cargoWidth * cargoHeight * packageCount) / 1000000;
  }, [cargoLength, cargoWidth, cargoHeight, packageCount]);

  const computedChargeableWeight = useMemo(() => {
    if (!cargoLength || !cargoWidth || !cargoHeight || !packageCount) return 0;
    // Standard IATA Air cargo volumetric divisor: 6000 cm3/kg
    return (cargoLength * cargoWidth * cargoHeight * packageCount) / 6000;
  }, [cargoLength, cargoWidth, cargoHeight, packageCount]);

  useEffect(() => {
    if (state?.success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state]);

  // Transform PostgreSQL Master Data into SearchableSelect Options
  const customerOptions: SearchOption[] = useMemo(
    () =>
      customers.map((c) => {
        let catLabel = "Pelanggan Terdaftar";
        let color: "blue" | "emerald" | "violet" | "amber" | "slate" = "blue";
        if (c.customerType === "FORWARDER_PARTNER") {
          catLabel = "Mitra Forwarder (Broker)";
          color = "violet";
        } else if (c.customerType === "DIRECT_CONSIGNEE") {
          catLabel = "Importir / Consignee";
          color = "blue";
        } else if (c.customerType === "DIRECT_SHIPPER") {
          catLabel = "Eksportir / Shipper";
          color = "emerald";
        } else if (c.customerType === "OVERSEAS_AGENT") {
          catLabel = "Agen Luar Negeri";
          color = "amber";
        }
        return {
          value: c.id,
          label: c.name,
          badge: c.customerCode,
          badgeColor: color,
          sublabel: c.taxId ? `NPWP: ${c.taxId} • ${catLabel}` : catLabel,
          category: catLabel,
        };
      }),
    [customers]
  );

  const vendorOptions: SearchOption[] = useMemo(
    () =>
      vendors.map((v) => ({
        value: v.id,
        label: v.name,
        badge: v.category,
        badgeColor: "violet",
        sublabel: `Penyedia Jasa (${v.category})`,
        category:
          v.category === "CARRIER_SEA"
            ? "Pelayaran Laut (Ocean Carrier)"
            : v.category === "CARRIER_AIR"
            ? "Maskapai Kargo Udara (Air Carrier)"
            : v.category === "HAULAGE_TRUCK"
            ? "Armada Truk Darat (Haulage)"
            : v.category === "CUSTOMS_BROKER"
            ? "PPJK & Kepabeanan"
            : "Carrier & Mitra Logistik",
      })),
    [vendors]
  );

  const portOptions: SearchOption[] = useMemo(
    () =>
      ports.map((p) => ({
        value: `[${p.portCode}] ${p.portName} (${p.city}, ${p.countryName})`,
        label: `${p.portName} (${p.city})`,
        badge: p.portCode,
        badgeColor: p.portType === "AIR_PORT" ? "violet" : "blue",
        sublabel: `${p.city}, ${p.countryName} • ${p.portType}`,
        category: p.portType === "AIR_PORT" ? "Bandara Internasional (Air Port)" : "Pelabuhan Laut (Sea Port)",
      })),
    [ports]
  );

  const transportModeOptions: SearchOption[] = [
    { value: "SEA", label: "Laut (Sea Freight - FCL/LCL)", badge: "SEA", badgeColor: "blue", category: "Moda Angkutan" },
    { value: "AIR", label: "Udara (Air Freight)", badge: "AIR", badgeColor: "violet", category: "Moda Angkutan" },
    { value: "INLAND", label: "Darat (Inland Trucking)", badge: "TRUCK", badgeColor: "amber", category: "Moda Angkutan" },
    { value: "MULTIMODAL", label: "Multimodal (Kombinasi)", badge: "MULTI", badgeColor: "emerald", category: "Moda Angkutan" },
  ];

  const shipmentTypeOptions: SearchOption[] = [
    { value: "EXPORT", label: "Ekspor (Export)", badge: "EXP", badgeColor: "emerald", category: "Arus Muatan" },
    { value: "IMPORT", label: "Impor (Import)", badge: "IMP", badgeColor: "blue", category: "Arus Muatan" },
    { value: "DOMESTIC", label: "Domestik (Antarpulau)", badge: "DOM", badgeColor: "amber", category: "Arus Muatan" },
    { value: "CROSS_TRADE", label: "Cross Trade (Transit)", badge: "CROSS", badgeColor: "violet", category: "Arus Muatan" },
  ];

  const incotermOptions: SearchOption[] = useMemo(
    () =>
      dictionaries.incoterms.map((inc) => ({
        value: inc.code,
        label: inc.label,
        badge: inc.code,
        badgeColor: "slate",
        category: "Syarat Perdagangan Internasional",
      })),
    [dictionaries.incoterms]
  );

  const packageTypeOptions: SearchOption[] = useMemo(
    () =>
      dictionaries.packageTypes.map((pkg) => ({
        value: pkg.code,
        label: pkg.label,
        badge: pkg.code,
        badgeColor: "slate",
        category: "Jenis Kemasan",
      })),
    [dictionaries.packageTypes]
  );

  const unitOptions: SearchOption[] = useMemo(
    () =>
      units.map((u) => ({
        value: u.id,
        label: `${u.unitCode} - ${u.unitName}`,
        badge: u.unitCategory || u.category,
        badgeColor: "blue",
        sublabel: u.symbol ? `Simbol: ${u.symbol}` : undefined,
        category: u.unitCategory || u.category,
      })),
    [units]
  );

  const containerUnitOptions: SearchOption[] = useMemo(
    () =>
      units
        .filter((u) => (u.unitCategory || u.category) === "CONTAINER" || (u.unitCategory || u.category) === "TRUCK")
        .map((u) => ({
          value: u.id,
          label: `${u.unitCode} - ${u.unitName}`,
          badge: u.unitCategory || u.category,
          badgeColor: (u.unitCategory || u.category) === "CONTAINER" ? "emerald" : "amber",
          sublabel: u.maxWeightKg ? `Kapasitas Maks: ${u.maxWeightKg.toLocaleString()} Kg` : undefined,
          category: (u.unitCategory || u.category) === "CONTAINER" ? "Kontainer Standar" : "Armada Truk Darat",
        })),
    [units]
  );

  const itemTypeOptions: SearchOption[] = useMemo(
    () =>
      itemTypes.map((it) => ({
        value: it.id,
        label: `[${it.itemCode}] ${it.name}`,
        badge: it.itemCode,
        badgeColor: it.isDangerousGoods ? "rose" : it.requiresColdChain ? "blue" : "emerald",
        sublabel: it.isDangerousGoods
          ? `⚠️ Dangerous Goods (DG Class: ${it.classDg || "N/A"})`
          : it.requiresColdChain
          ? "❄️ Cold Chain / Reefer Required"
          : "Standard General Cargo",
        category: it.isDangerousGoods ? "Dangerous Goods (DG)" : "General Cargo",
      })),
    [itemTypes]
  );

  const currencyOptions: SearchOption[] = useMemo(
    () =>
      currencies.map((c) => ({
        value: c.id,
        label: `${c.code} (${c.symbol}) - ${c.name}`,
        badge: c.code,
        badgeColor: c.isBaseCurrency ? "emerald" : "violet",
        sublabel: c.isBaseCurrency ? "Mata Uang Dasar (Base)" : `Standard Kurs: ${c.exchangeRate.toLocaleString()}`,
        category: c.isBaseCurrency ? "Mata Uang Pembukuan" : "Valuta Asing (Forex)",
      })),
    [currencies]
  );

  const commodityOptions: SearchOption[] = useMemo(
    () =>
      commodities.map((c) => ({
        value: c.id,
        label: c.name,
        badge: c.hsCode ? `HS: ${c.hsCode}` : "COMMODITY",
        badgeColor: "amber",
        sublabel: c.hsCode ? `Harmonized System Code: ${c.hsCode}` : "Klasifikasi Komoditas Ekspor/Impor",
        category: "Master Komoditas & HS Code",
      })),
    [commodities]
  );

  const defaultCurrencyId = useMemo(() => {
    const base = currencies.find((c) => c.isBaseCurrency);
    return base ? base.id : currencies[0]?.id || "";
  }, [currencies]);

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link
              href="/jobs"
              className="hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Manajemen Job File
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300">Pembuatan Job File</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Pendaftaran Job File (Shipment Order)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Nomor unik di-generate secara otomatis dan terisolasi berdasarkan MasterPrefix tenant.
          </p>
        </div>

        {/* Status Preview Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-[#121620] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl px-3.5 py-2 shadow-sm transition-colors">
          <div className="h-8 w-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
            <Ship className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Alokasi No. Transaksi:
              </span>
              <Lock className="h-3 w-3 text-slate-400" />
            </div>
            <p className="text-sm font-extrabold text-violet-600 dark:text-violet-400 font-mono">
              {state?.jobFileNumber || previewJobNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification Modal / Banner */}
      {state?.success && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-200">
                Job File Berhasil Disimpan ke PostgreSQL!
              </h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Nomor Job File resmi:{" "}
                <span className="font-extrabold font-mono text-emerald-900 dark:text-emerald-200 underline">
                  {state.jobFileNumber}
                </span>{" "}
                telah terikat ke data tenant {tenant.companyName}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              href="/jobs"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
            >
              Lihat Daftar Job File
            </Link>
          </div>
        </div>
      )}

      {/* Error Feedback */}
      {state?.error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-200">Gagal Menyimpan Data</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* FORM: DENSE ENTERPRISE B2B GRID (ZERO MOCK DATA / PURE POSTGRESQL) */}
      {/* ==================================================================== */}
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="tenantIdentifier" value={tenant.id} />

        {/* SECTION 1: HEADER OPERASI & STAKEHOLDERS (Selling & Buying) */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
            <div className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Header Operasi &amp; Pihak Terkait (Relasi Database)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Field: Job File Number Preview (Read-Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor Job File (Auto MasterPrefix)
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={previewJobNumber}
                  className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-violet-700 dark:text-violet-400 cursor-not-allowed select-none"
                />
                <Sparkles className="absolute right-3 top-2.5 h-3.5 w-3.5 text-violet-400" />
              </div>
            </div>

            {/* Field: Tanggal Order */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Pembuatan
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="bookingDate"
                  defaultValue={today}
                  required
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <Calendar className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Field: Relational Customer (Selling / AR) with SearchableSelect */}
            <div>
              <SearchableSelect
                name="customerId"
                label="Customer / Shipper (Sisi Selling)"
                required
                options={customerOptions}
                placeholder="-- Pilih Customer Terdaftar --"
                searchPlaceholder="Cari nama atau kode customer..."
                emptyMessage="Customer tidak ditemukan. Tambahkan di menu Master."
              />
            </div>

            {/* Field: Relational Vendor (Buying / AP) with SearchableSelect */}
            <div>
              <SearchableSelect
                name="vendorId"
                label="Carrier &amp; Penyedia Jasa (Sisi Buying / AP)"
                options={vendorOptions}
                placeholder="-- Pilih Carrier / Transporter --"
                searchPlaceholder="Cari pelayaran, maskapai, trucking..."
                emptyMessage="Carrier tidak ditemukan. Tambahkan di menu Carrier &amp; Mitra."
              />
            </div>
          </div>

          {/* Sub-Panel: Dokumen Permintaan & Referensi Klien (Broker & Direct) */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>Dokumen Permintaan &amp; Referensi Klien (Broker &amp; Direct)</span>
              </span>
              <span className="text-[10px] text-slate-400">Dasar Alur Kerja Forwarding</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Ref Klien / Job Order Mitra
                </label>
                <input
                  type="text"
                  name="customerRefNo"
                  placeholder="Contoh: FWD-JKT-2026-089 atau PO-102"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Wajib diisi jika order limpahan dari perusahaan forwarder rekanan.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Shipping Instruction (SI)
                </label>
                <input
                  type="text"
                  name="shippingInstructionNo"
                  placeholder="Contoh: SI/2026/10/004"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Instruksi resmi dari Shipper / Eksportir.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Commercial Invoice (CI) / PL
                </label>
                <input
                  type="text"
                  name="commercialInvoiceNo"
                  placeholder="Contoh: INV-EXP-2026-042"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Faktur komersial muatan barang.</p>
              </div>
            </div>
          </div>

          {/* Sub-Panel: Penetapan Pihak Tertagih (Billing Party & Tax Entity) */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                <span>Pihak Tertagih (Billing Party &amp; Faktur Pajak PPN 1.1%)</span>
              </span>
              <span className="text-[10px] text-slate-400">Kepatuhan PMK 71/2022</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tagihan Diarahkan Kepada (Billing Party Role)
                </label>
                <select
                  name="billingPartyType"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 font-medium"
                >
                  <option value="SHIPPER">Shipper / Eksportir (Freight Prepaid - Default)</option>
                  <option value="CONSIGNEE">Consignee / Importir (Freight Collect)</option>
                  <option value="FORWARDER_PARTNER">Perusahaan Forwarder Mitra (B2B Brokerage)</option>
                  <option value="THIRD_PARTY">Pihak Ketiga Tertunjuk / Agen</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">Menentukan entitas mana yang akan dicantumkan di Invoice AR.</p>
              </div>

              <div>
                <SearchableSelect
                  name="billingPartyId"
                  label="Pilih Entitas Tertagih Khusus (Opsional jika beda dari Customer)"
                  options={customerOptions}
                  placeholder="-- Default: Sama dengan Customer di atas --"
                  searchPlaceholder="Cari customer / forwarder mitra..."
                  emptyMessage="Customer tidak ditemukan."
                />
              </div>
            </div>
          </div>

          {/* Sub-Panel: Penerima Barang di Luar Negeri (Consignee & Notify Party - AWB / B/L Standard) */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-violet-600" />
                <span>Pihak Penerima (Consignee &amp; Notify Party Internasional)</span>
              </span>
              <span className="text-[10px] text-slate-400">Standar Dokumen AWB &amp; Ocean B/L</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Consignee / Penerima
                </label>
                <input
                  type="text"
                  name="consigneeName"
                  defaultValue="DO THI THAO"
                  placeholder="Nama orang atau nama PT penerima"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Telepon Consignee
                </label>
                <input
                  type="text"
                  name="consigneePhone"
                  defaultValue="020-58885793"
                  placeholder="+856 ... atau nomor kontak penerima"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kota &amp; Negara Tujuan
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    name="consigneeCity"
                    defaultValue="Vientiane"
                    placeholder="Kota (Vientiane)"
                    className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500"
                  />
                  <input
                    type="text"
                    name="consigneeCountry"
                    defaultValue="LA"
                    placeholder="Negara (LA / SG / ID)"
                    className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Akun IATA / NPWP Penerima
                </label>
                <input
                  type="text"
                  name="consigneeAccountNo"
                  placeholder="Nomor Akun atau NPWP Penerima (opsional)"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap Consignee
                </label>
                <input
                  type="text"
                  name="consigneeAddress"
                  defaultValue="SHENGDA INTERNATIONAL HOTEL, SIKHOTTABONG"
                  placeholder="Alamat jalan, gedung, nomor distrik penerima"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notify Party (Pihak yang Diberitahu Saat Kedatangan)
                </label>
                <input
                  type="text"
                  name="notifyParty"
                  defaultValue="SAME AS CONSIGNEE"
                  placeholder="SAME AS CONSIGNEE atau nama agen pengambil barang"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DETAIL RUTE & TRANSPORTASI */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Detail Rute, Pelabuhan &amp; Kapal / Pesawat
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Moda Transportasi */}
            <div>
              <SearchableSelect
                name="transportMode"
                label="Moda Transportasi"
                defaultValue="SEA"
                options={transportModeOptions}
                placeholder="Pilih moda angkutan"
                searchPlaceholder="Cari moda (Laut, Udara, Darat)..."
              />
            </div>

            {/* Tipe Shipment */}
            <div>
              <SearchableSelect
                name="shipmentType"
                label="Tipe Pengiriman"
                defaultValue="EXPORT"
                options={shipmentTypeOptions}
                placeholder="Pilih tipe arus barang"
                searchPlaceholder="Cari tipe (Ekspor, Impor, Domestik)..."
              />
            </div>

            {/* Incoterm dari SystemDictionary DB */}
            <div>
              <SearchableSelect
                name="incoterm"
                label="Incoterm (Kamus Sistem)"
                defaultValue="FOB"
                options={incotermOptions}
                placeholder="Pilih incoterm"
                searchPlaceholder="Cari FOB, CIF, EXW, DDP..."
              />
            </div>

            {/* Port of Loading (POL) dari MasterPort PostgreSQL */}
            <div>
              <SearchableSelect
                name="originPort"
                label="Port of Loading (POL / Pelabuhan Muat)"
                required
                options={portOptions}
                placeholder="-- Pilih Pelabuhan Muat --"
                searchPlaceholder="Ketik kode (IDJKT, IDCGK) atau nama pelabuhan..."
                emptyMessage="Pelabuhan tidak ditemukan di MasterPort."
              />
            </div>

            {/* Port of Discharge (POD) dari MasterPort PostgreSQL */}
            <div>
              <SearchableSelect
                name="destinationPort"
                label="Port of Discharge (POD / Pelabuhan Bongkar)"
                required
                options={portOptions}
                placeholder="-- Pilih Pelabuhan Bongkar --"
                searchPlaceholder="Ketik kode (SGSIN, NLRTM) atau nama pelabuhan..."
                emptyMessage="Pelabuhan tidak ditemukan di MasterPort."
              />
            </div>

            {/* Nama Kapal / Pesawat */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Kapal / Pesawat (Vessel / Flight)
              </label>
              <input
                type="text"
                name="vesselOrFlight"
                defaultValue="MAERSK JAKARTA"
                placeholder="Contoh: MAERSK JAKARTA atau GA-820"
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* No. Voyage / Flight */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Voyage / Flight No.
              </label>
              <input
                type="text"
                name="voyageOrFlightNo"
                defaultValue="V.2611N"
                placeholder="Contoh: V.2611N"
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Master BL / AWB */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Master B/L atau MAWB No.
              </label>
              <input
                type="text"
                name="masterBillOfLading"
                defaultValue="807-2221 6040"
                placeholder="Contoh: 807-22216040 atau MSK982347102"
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* House BL / HAWB */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                House B/L atau HAWB No.
              </label>
              <input
                type="text"
                name="houseBillOfLading"
                defaultValue="HAWB-807-001"
                placeholder="Contoh: HAWB-2026-004 atau HBL-JKT-091"
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          {/* Sub-Panel: Multi-Leg & Air Transit Hub Routing (Transit / Connecting Flight) */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-indigo-600" />
                <span>Multi-Leg &amp; Transit Hub (Rute Penerbangan / Pelayaran Bersambung)</span>
              </span>
              <span className="text-[10px] text-slate-400">Penting untuk Kargo Udara dengan Transit (e.g. CGK -&gt; KUL -&gt; VTE)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bandara / Hub Transit (Transit Port)
                </label>
                <input
                  type="text"
                  name="transitPort"
                  defaultValue="KUL - Kuala Lumpur International Airport"
                  placeholder="Contoh: KUL atau SIN"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maskapai Lanjutan (Connecting Carrier)
                </label>
                <input
                  type="text"
                  name="secondCarrier"
                  defaultValue="AirAsia Berhad (AK)"
                  placeholder="Contoh: AirAsia (AK) atau Singapore Airlines (SQ)"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No. Flight Lanjutan (Connecting Flight / Date)
                </label>
                <input
                  type="text"
                  name="connectingFlightNo"
                  defaultValue="AK552/14 JUN"
                  placeholder="Contoh: AK552/14 atau SQ951"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: SPESIFIKASI KARGO & MUATAN */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
            <div className="h-7 w-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Spesifikasi Kargo (Pieces, Berat &amp; Volume)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Jumlah Koli */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jumlah Koli (Pieces / Packages)
              </label>
              <input
                type="number"
                name="packageCount"
                min="1"
                defaultValue="1"
                required
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Jenis Kemasan dari DB SystemDictionary */}
            <div>
              <SearchableSelect
                name="packageType"
                label="Tipe Kemasan / Paket"
                defaultValue="20'DC"
                options={packageTypeOptions}
                placeholder="Pilih jenis kemasan"
                searchPlaceholder="Cari kemasan (Carton, Pallet, 20'DC)..."
              />
            </div>

            {/* Satuan Kargo / UoM (MasterUnit PostgreSQL) */}
            <div>
              <SearchableSelect
                name="packageUnitId"
                label="Satuan Ukuran Kargo (MasterUnit)"
                options={unitOptions}
                placeholder="-- Pilih Satuan UoM --"
                searchPlaceholder="Cari satuan (Kg, CBM, Cartons, TEU)..."
                emptyMessage="Satuan tidak ditemukan di MasterUnit."
              />
            </div>

            {/* Pilihan Dimensi Kontainer / Armada Truk (MasterUnit: CONTAINER / TRUCK) */}
            <div>
              <SearchableSelect
                name="containerUnitId"
                label="Dimensi Kontainer / Armada Truk"
                options={containerUnitOptions}
                placeholder="-- Pilih Armada / Kontainer --"
                searchPlaceholder="Cari armada (20'GP, 40'HC, Tronton, CDE)..."
                emptyMessage="Dimensi armada tidak ditemukan."
              />
            </div>

            {/* Kategori Komoditas (MasterItemType PostgreSQL) */}
            <div>
              <SearchableSelect
                name="itemTypeId"
                label="Klasifikasi Komoditas (MasterItemType)"
                options={itemTypeOptions}
                placeholder="-- Pilih Kategori Komoditas --"
                searchPlaceholder="Cari barang (General, Dangerous Goods, Reefer)..."
                emptyMessage="Komoditas tidak ditemukan di MasterItemType."
              />
            </div>

            {/* Referensi HS Code & MasterCommodity Global */}
            <div>
              <SearchableSelect
                name="commodityId"
                label="Komoditas &amp; HS Code (MasterCommodity)"
                options={commodityOptions}
                placeholder="-- Pilih HS Code / Komoditas --"
                searchPlaceholder="Cari komoditas (Tobacco, Electronics)..."
                emptyMessage="Komoditas belum ada di MasterCommodity."
              />
            </div>

            {/* Berat Kotor / Gross Weight (Kg) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Berat Kotor (Gross Weight - Kg)
              </label>
              <input
                type="number"
                step="0.01"
                name="grossWeightKg"
                defaultValue="420.00"
                required
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Volume CBM */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Volume Muatan (CBM)
              </label>
              <input
                type="number"
                step="0.001"
                name="volumeWeightCbm"
                value={computedCbm > 0 ? computedCbm.toFixed(3) : "2.184"}
                onChange={() => {}}
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-white/[0.03] font-mono"
              />
            </div>

            {/* Container & Seal Summary */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                No. Kontainer / No. Segel (Jika Ada)
              </label>
              <input
                type="text"
                name="containerSummary"
                defaultValue="24 CARTONS (STICKS / GENERAL CARGO)"
                placeholder="Contoh: 1x20'DC (MRKU1234567 / SEAL9910)"
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Deskripsi Barang / Commodity */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Deskripsi Detail Komoditas Barang
              </label>
              <input
                type="text"
                name="commodityDescription"
                defaultValue="STICKS / TOBACCO PRODUCTS"
                placeholder="Deskripsi barang ekspor / impor"
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          {/* Sub-Panel: Dimensi Kardus Fisik Kargo (P x L x T cm) & Kalkulator IATA */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-cyan-600" />
                <span>Dimensi Kardus Fisik Kargo (Panjang x Lebar x Tinggi cm)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/50">
                  Volumetrik IATA: {computedChargeableWeight.toFixed(1)} Kg
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                  CBM: {computedCbm.toFixed(3)} m³
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Panjang Kardus (P - cm)
                </label>
                <input
                  type="number"
                  name="cargoLength"
                  value={cargoLength}
                  onChange={(e) => setCargoLength(parseFloat(e.target.value) || 0)}
                  placeholder="Contoh: 40"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lebar Kardus (L - cm)
                </label>
                <input
                  type="number"
                  name="cargoWidth"
                  value={cargoWidth}
                  onChange={(e) => setCargoWidth(parseFloat(e.target.value) || 0)}
                  placeholder="Contoh: 26"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tinggi Kardus (T - cm)
                </label>
                <input
                  type="number"
                  name="cargoHeight"
                  value={cargoHeight}
                  onChange={(e) => setCargoHeight(parseFloat(e.target.value) || 0)}
                  placeholder="Contoh: 35"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              *Dimensi per kardus akan dihitung secara proporsional ke tabel operasional muatan (JobCargoDetail).
            </p>
          </div>
        </div>

        {/* SECTION 4: ESTIMASI FINANSIAL & CATATAN */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-white/[0.08]">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Estimasi Finansial &amp; Valuasi IATA Standar Internasional
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MasterCurrency Selection */}
            <div>
              <SearchableSelect
                name="currencyId"
                label="Mata Uang (MasterCurrency)"
                defaultValue={defaultCurrencyId}
                options={currencyOptions}
                placeholder="-- Pilih Mata Uang --"
                searchPlaceholder="Cari mata uang (IDR, USD, SGD)..."
                emptyMessage="Mata uang tidak ditemukan di MasterCurrency."
              />
            </div>

            {/* Selling Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tagihan Pelanggan (Selling / AR)
              </label>
              <input
                type="number"
                step="1000"
                name="sellingAmount"
                defaultValue="38418000"
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#1a2130] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Buying Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Biaya Carrier (Buying / AP)
              </label>
              <input
                type="number"
                step="1000"
                name="buyingAmount"
                defaultValue="30224700"
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1a2130] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Payment Term Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Metode Pembayaran (CHGS Code)
              </label>
              <select
                name="paymentTermMode"
                defaultValue="PP"
                className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-emerald-500"
              >
                <option value="PP">PP - Freight Prepaid (Dibayar di Asal)</option>
                <option value="CC">CC - Freight Collect (Dibayar di Tujuan)</option>
              </select>
            </div>
          </div>

          {/* Sub-Panel: IATA Valuasi & Handling Info */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Valuasi IATA &amp; Instruksi Khusus (Declared Value &amp; Handling)</span>
              </span>
              <span className="text-[10px] text-slate-400">Standar Hukum Pengangkutan Udara (Warsaw/Montreal)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Declared Value for Carriage
                </label>
                <input
                  type="text"
                  name="declaredValueCarriage"
                  defaultValue="NVD"
                  placeholder="NVD (No Value Declared) atau nominal"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-emerald-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Declared Value for Customs
                </label>
                <input
                  type="text"
                  name="declaredValueCustoms"
                  defaultValue="NCV"
                  placeholder="NCV (No Customs Value) atau nominal"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-emerald-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount of Insurance
                </label>
                <input
                  type="text"
                  name="insuranceAmount"
                  defaultValue="NIL"
                  placeholder="NIL atau nominal asuransi"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-emerald-500 font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Handling Information (Instruksi Penanganan Khusus Bandara / Maskapai)
                </label>
                <input
                  type="text"
                  name="handlingInformation"
                  defaultValue="PLEASE CONTACT TO OUR CONSIGNEE UPON CARGO ARRIVAL. THANKS"
                  placeholder="Instruksi handling / keep upright / dangerous goods"
                  className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Catatan Khusus */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08]">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Instruksi Khusus / Remarks
            </label>
            <input
              type="text"
              name="remarks"
              placeholder="Instruksi handling / customs"
              className="w-full border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#1a2130] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* SUBMISSION BAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/jobs"
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-violet-200 shadow-md shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Menyimpan ke PostgreSQL...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Simpan Job File</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
