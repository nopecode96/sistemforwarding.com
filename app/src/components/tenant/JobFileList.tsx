"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Ship,
  Plane,
  Truck,
  Plus,
  Search,
  Building2,
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Navigation2,
  Anchor,
  Box,
  Eye,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  Layers,
  Globe2,
  Scale,
  Receipt,
  Copy,
  Check,
  Package,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { updateJobFile, deleteJobFile } from "@/actions/jobActions";
import { JobFileStatus, BizMode, Bound, TransportMode, ShipmentType } from "@prisma/client";

export interface CargoDetailItem {
  id: string;
  pieces: number;
  grossWeight: number;
  chargeableWeight: number;
  volumeCbm: number;
  length: number | null;
  width: number | null;
  height: number | null;
  description: string | null;
  unitCode: string | null;
  unitName: string | null;
  commodityName: string | null;
  hsCode: string | null;
}

export interface JobFileItem {
  id: string;
  jobFileNumber: string;
  customerRefNo?: string | null;
  shippingInstructionNo?: string | null;
  commercialInvoiceNo?: string | null;
  billingPartyType?: string | null;
  billingPartyName?: string | null;
  customerName: string;
  customerCode?: string;
  customerTaxId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  vendorName?: string;
  vendorCode?: string;
  status: string;
  transportMode: string;
  bizMode?: string;
  bound?: string;
  shipmentType: string;
  incoterm?: string;
  incotermId?: string | null;
  incotermName?: string | null;
  exchangeRate?: number | null;
  originPort: string;
  originPortDetails?: { portCode: string; portName: string; city: string; countryName: string } | null;
  destinationPort: string;
  destinationPortDetails?: { portCode: string; portName: string; city: string; countryName: string } | null;
  vesselOrFlight?: string | null;
  voyageOrFlightNo?: string | null;
  masterBillOfLading?: string | null;
  houseBillOfLading?: string | null;
  consigneeName?: string | null;
  consigneeAddress?: string | null;
  consigneeCity?: string | null;
  consigneeCountry?: string | null;
  consigneePhone?: string | null;
  consigneePostalCode?: string | null;
  consigneeTaxId?: string | null;
  consigneeAccountNo?: string | null;
  notifyParty?: string | null;
  transitPort?: string | null;
  secondCarrier?: string | null;
  connectingFlightNo?: string | null;
  paymentTermMode?: string | null;
  declaredValueCarriage?: string | null;
  declaredValueCustoms?: string | null;
  insuranceAmount?: string | null;
  handlingInformation?: string | null;
  containerSummary?: string | null;
  packageCount?: number | null;
  packageType?: string | null;
  commodityDescription?: string | null;
  grossWeightKg?: number | null;
  volumeWeightCbm?: number | null;
  sellingAmount: number;
  buyingAmount: number;
  grossProfit: number;
  marginPercent: number;
  remarks?: string | null;
  createdAt: string;
  cargoDetails?: CargoDetailItem[];
}

interface JobFileListProps {
  tenantSubdomain: string;
  initialJobs: JobFileItem[];
  masterIncoterms?: Array<{ id: string; code: string; name: string }>;
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function JobFileList({
  tenantSubdomain,
  initialJobs,
  masterIncoterms = [],
}: JobFileListProps) {
  const [jobs, setJobs] = useState<JobFileItem[]>(initialJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [selectedDetailJob, setSelectedDetailJob] = useState<JobFileItem | null>(null);
  const [editingJob, setEditingJob] = useState<JobFileItem | null>(null);
  const [deletingJob, setDeletingJob] = useState<JobFileItem | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState<{
    customerRefNo: string;
    shippingInstructionNo: string;
    commercialInvoiceNo: string;
    billingPartyType: string;
    status: JobFileStatus;
    bizMode: BizMode;
    bound: Bound;
    incoterm: string;
    incotermId: string;
    exchangeRate: number;
    vesselOrFlight: string;
    voyageOrFlightNo: string;
    masterBillOfLading: string;
    houseBillOfLading: string;
    consigneeName: string;
    consigneeAddress: string;
    consigneeCity: string;
    consigneeCountry: string;
    consigneePhone: string;
    consigneeAccountNo: string;
    notifyParty: string;
    transitPort: string;
    secondCarrier: string;
    connectingFlightNo: string;
    paymentTermMode: string;
    declaredValueCarriage: string;
    declaredValueCustoms: string;
    insuranceAmount: string;
    handlingInformation: string;
    grossWeightKg: number;
    volumeWeightCbm: number;
    packageCount: number;
    packageType: string;
    containerSummary: string;
    commodityDescription: string;
    sellingAmount: number;
    buyingAmount: number;
    remarks: string;
  }>({
    customerRefNo: "",
    shippingInstructionNo: "",
    commercialInvoiceNo: "",
    billingPartyType: "SHIPPER",
    status: JobFileStatus.DRAFT,
    bizMode: BizMode.SEA,
    bound: Bound.EXPORT,
    incoterm: "FOB",
    incotermId: "",
    exchangeRate: 1,
    vesselOrFlight: "",
    voyageOrFlightNo: "",
    masterBillOfLading: "",
    houseBillOfLading: "",
    consigneeName: "",
    consigneeAddress: "",
    consigneeCity: "",
    consigneeCountry: "",
    consigneePhone: "",
    consigneeAccountNo: "",
    notifyParty: "",
    transitPort: "",
    secondCarrier: "",
    connectingFlightNo: "",
    paymentTermMode: "PP",
    declaredValueCarriage: "NVD",
    declaredValueCustoms: "NCV",
    insuranceAmount: "NIL",
    handlingInformation: "",
    grossWeightKg: 0,
    volumeWeightCbm: 0,
    packageCount: 1,
    packageType: "Cartons",
    containerSummary: "",
    commodityDescription: "",
    sellingAmount: 0,
    buyingAmount: 0,
    remarks: "",
  });

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedBL, setCopiedBL] = useState(false);

  // Status mapping colors & labels
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_TRANSIT":
        return {
          label: "In-Transit",
          classes:
            "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-500/30",
          dot: "bg-blue-500 animate-pulse",
        };
      case "BOOKED":
        return {
          label: "Booked",
          classes:
            "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30",
          dot: "bg-indigo-500",
        };
      case "CUSTOMS_CLEARANCE":
        return {
          label: "Customs Clearance",
          classes:
            "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30",
          dot: "bg-amber-500",
        };
      case "ARRIVED":
      case "DELIVERED":
        return {
          label: status === "ARRIVED" ? "Arrived" : "Delivered",
          classes:
            "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30",
          dot: "bg-emerald-500",
        };
      case "CLOSED":
        return {
          label: "Closed",
          classes:
            "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10",
          dot: "bg-slate-400",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          classes:
            "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/30",
          dot: "bg-rose-500",
        };
      case "DRAFT":
      default:
        return {
          label: "Draft",
          classes:
            "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10",
          dot: "bg-slate-400",
        };
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (job: JobFileItem) => {
    setEditingJob(job);
    setEditFormData({
      customerRefNo: job.customerRefNo || "",
      shippingInstructionNo: job.shippingInstructionNo || "",
      commercialInvoiceNo: job.commercialInvoiceNo || "",
      billingPartyType: job.billingPartyType || "SHIPPER",
      status: (job.status as JobFileStatus) || JobFileStatus.DRAFT,
      bizMode: (job.bizMode as BizMode) || (job.transportMode === "AIR" ? BizMode.AIR : BizMode.SEA),
      bound: (job.bound as Bound) || (job.shipmentType === "IMPORT" ? Bound.IMPORT : Bound.EXPORT),
      incoterm: job.incoterm || "FOB",
      incotermId: job.incotermId || "",
      exchangeRate: job.exchangeRate || 1,
      vesselOrFlight: job.vesselOrFlight || "",
      voyageOrFlightNo: job.voyageOrFlightNo || "",
      masterBillOfLading: job.masterBillOfLading || "",
      houseBillOfLading: job.houseBillOfLading || "",
      consigneeName: job.consigneeName || "",
      consigneeAddress: job.consigneeAddress || "",
      consigneeCity: job.consigneeCity || "",
      consigneeCountry: job.consigneeCountry || "",
      consigneePhone: job.consigneePhone || "",
      consigneeAccountNo: job.consigneeAccountNo || "",
      notifyParty: job.notifyParty || "",
      transitPort: job.transitPort || "",
      secondCarrier: job.secondCarrier || "",
      connectingFlightNo: job.connectingFlightNo || "",
      paymentTermMode: job.paymentTermMode || "PP",
      declaredValueCarriage: job.declaredValueCarriage || "NVD",
      declaredValueCustoms: job.declaredValueCustoms || "NCV",
      insuranceAmount: job.insuranceAmount || "NIL",
      handlingInformation: job.handlingInformation || "",
      grossWeightKg: job.grossWeightKg || 0,
      volumeWeightCbm: job.volumeWeightCbm || 0,
      packageCount: job.packageCount || 1,
      packageType: job.packageType || "Cartons",
      containerSummary: job.containerSummary || "",
      commodityDescription: job.commodityDescription || "",
      sellingAmount: job.sellingAmount || 0,
      buyingAmount: job.buyingAmount || 0,
      remarks: job.remarks || "",
    });
  };

  // Submit Edit Form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    startTransition(async () => {
      const res = await updateJobFile({
        id: editingJob.id,
        tenantSubdomain,
        customerRefNo: editFormData.customerRefNo || null,
        shippingInstructionNo: editFormData.shippingInstructionNo || null,
        commercialInvoiceNo: editFormData.commercialInvoiceNo || null,
        billingPartyType: (editFormData.billingPartyType as any) || "SHIPPER",
        status: editFormData.status,
        bizMode: editFormData.bizMode,
        bound: editFormData.bound,
        incoterm: editFormData.incoterm,
        incotermId: editFormData.incotermId || null,
        exchangeRate: editFormData.exchangeRate,
        vesselOrFlight: editFormData.vesselOrFlight,
        voyageOrFlightNo: editFormData.voyageOrFlightNo,
        masterBillOfLading: editFormData.masterBillOfLading,
        houseBillOfLading: editFormData.houseBillOfLading,
        consigneeName: editFormData.consigneeName,
        consigneeAddress: editFormData.consigneeAddress,
        consigneeCity: editFormData.consigneeCity,
        consigneeCountry: editFormData.consigneeCountry,
        consigneePhone: editFormData.consigneePhone,
        consigneeAccountNo: editFormData.consigneeAccountNo,
        notifyParty: editFormData.notifyParty,
        transitPort: editFormData.transitPort,
        secondCarrier: editFormData.secondCarrier,
        connectingFlightNo: editFormData.connectingFlightNo,
        paymentTermMode: editFormData.paymentTermMode,
        declaredValueCarriage: editFormData.declaredValueCarriage,
        declaredValueCustoms: editFormData.declaredValueCustoms,
        insuranceAmount: editFormData.insuranceAmount,
        handlingInformation: editFormData.handlingInformation,
        grossWeightKg: editFormData.grossWeightKg,
        volumeWeightCbm: editFormData.volumeWeightCbm,
        packageCount: editFormData.packageCount,
        packageType: editFormData.packageType,
        containerSummary: editFormData.containerSummary,
        commodityDescription: editFormData.commodityDescription,
        sellingAmount: editFormData.sellingAmount,
        buyingAmount: editFormData.buyingAmount,
        remarks: editFormData.remarks,
      });

      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Job File berhasil diperbarui." });
        // Optimistic update
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id === editingJob.id) {
              const selling = editFormData.sellingAmount;
              const buying = editFormData.buyingAmount;
              const profit = selling - buying;
              const margin = selling > 0 ? (profit / selling) * 100 : 0;
              return {
                ...j,
                customerRefNo: editFormData.customerRefNo || null,
                shippingInstructionNo: editFormData.shippingInstructionNo || null,
                commercialInvoiceNo: editFormData.commercialInvoiceNo || null,
                billingPartyType: editFormData.billingPartyType,
                status: editFormData.status,
                bizMode: editFormData.bizMode,
                bound: editFormData.bound,
                incoterm: editFormData.incoterm,
                incotermId: editFormData.incotermId || null,
                exchangeRate: editFormData.exchangeRate,
                vesselOrFlight: editFormData.vesselOrFlight,
                voyageOrFlightNo: editFormData.voyageOrFlightNo,
                masterBillOfLading: editFormData.masterBillOfLading,
                houseBillOfLading: editFormData.houseBillOfLading,
                consigneeName: editFormData.consigneeName,
                consigneeAddress: editFormData.consigneeAddress,
                consigneeCity: editFormData.consigneeCity,
                consigneeCountry: editFormData.consigneeCountry,
                consigneePhone: editFormData.consigneePhone,
                consigneeAccountNo: editFormData.consigneeAccountNo,
                notifyParty: editFormData.notifyParty,
                transitPort: editFormData.transitPort,
                secondCarrier: editFormData.secondCarrier,
                connectingFlightNo: editFormData.connectingFlightNo,
                paymentTermMode: editFormData.paymentTermMode,
                declaredValueCarriage: editFormData.declaredValueCarriage,
                declaredValueCustoms: editFormData.declaredValueCustoms,
                insuranceAmount: editFormData.insuranceAmount,
                handlingInformation: editFormData.handlingInformation,
                grossWeightKg: editFormData.grossWeightKg,
                volumeWeightCbm: editFormData.volumeWeightCbm,
                packageCount: editFormData.packageCount,
                packageType: editFormData.packageType,
                containerSummary: editFormData.containerSummary,
                commodityDescription: editFormData.commodityDescription,
                sellingAmount: selling,
                buyingAmount: buying,
                grossProfit: profit,
                marginPercent: margin,
                remarks: editFormData.remarks,
              };
            }
            return j;
          })
        );
        setEditingJob(null);
      } else {
        setFeedback({ type: "error", text: res.error || "Gagal memperbarui Job File." });
      }
    });
  };

  // Delete Job File
  const handleConfirmDelete = () => {
    if (!deletingJob) return;

    startTransition(async () => {
      const res = await deleteJobFile(deletingJob.id, tenantSubdomain);
      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Job File berhasil dihapus." });
        setJobs((prev) => prev.filter((j) => j.id !== deletingJob.id));
        setDeletingJob(null);
      } else {
        setFeedback({ type: "error", text: res.error || "Gagal menghapus Job File." });
      }
    });
  };

  // Filter & Search logic
  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      job.jobFileNumber.toLowerCase().includes(q) ||
      job.customerName.toLowerCase().includes(q) ||
      (job.customerRefNo && job.customerRefNo.toLowerCase().includes(q)) ||
      (job.shippingInstructionNo && job.shippingInstructionNo.toLowerCase().includes(q)) ||
      (job.commercialInvoiceNo && job.commercialInvoiceNo.toLowerCase().includes(q)) ||
      (job.vendorName && job.vendorName.toLowerCase().includes(q)) ||
      (job.masterBillOfLading && job.masterBillOfLading.toLowerCase().includes(q)) ||
      (job.houseBillOfLading && job.houseBillOfLading.toLowerCase().includes(q)) ||
      (job.vesselOrFlight && job.vesselOrFlight.toLowerCase().includes(q)) ||
      job.originPort.toLowerCase().includes(q) ||
      job.destinationPort.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    const matchesMode =
      modeFilter === "ALL" ||
      job.transportMode === modeFilter ||
      job.bizMode === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  // Pagination logic (10 items per page)
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari No. Job File, Customer, BL/AWB, Kapal/Pesawat, POL/POD..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">Semua Moda Transportasi</option>
            <option value="AIR">Udara (Air Freight)</option>
            <option value="SEA">Laut (Sea Freight)</option>
            <option value="INLAND">Darat (Inland Trucking)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">Semua Status Kargo</option>
            <option value="DRAFT">Draft</option>
            <option value="BOOKED">Booked</option>
            <option value="IN_TRANSIT">In-Transit</option>
            <option value="CUSTOMS_CLEARANCE">Customs Clearance</option>
            <option value="ARRIVED">Arrived</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <a
            href={`/api/${tenantSubdomain}/export/jobs`}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all shrink-0"
            title="Download Excel Semua Job File"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Download Excel</span>
          </a>

          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Job File Baru</span>
          </Link>
        </div>
      </div>

      {/* Job Card Grid List */}
      {paginatedJobs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08]">
          <div className="h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center mb-3">
            <Ship className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Tidak Ada Job File Ditemukan
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL" || modeFilter !== "ALL"
              ? "Coba ubah kata kunci pencarian atau filter status untuk menemukan dokumen."
              : "Belum ada transaksi operasional kargo tercatat di ruang kerja ini."}
          </p>
          <div className="mt-4">
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Input Job File Pertama</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paginatedJobs.map((job) => {
            const statusConfig = getStatusBadge(job.status);
            const isAir = job.bizMode === "AIR" || job.transportMode === "AIR";

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-6 shadow-xs hover:border-violet-500/30 transition-all space-y-4"
              >
                {/* Header: Job File Number, Mode, and Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                        isAir
                          ? "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-500/20"
                          : "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border-violet-500/20"
                      }`}
                    >
                      {isAir ? <Plane className="h-5 w-5" /> : <Ship className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm sm:text-base font-black text-violet-600 dark:text-violet-400">
                          {job.jobFileNumber}
                        </span>
                        {job.customerRefNo && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/80" title="Nomor Referensi Klien / PO / Job Order Mitra">
                            Ref: {job.customerRefNo}
                          </span>
                        )}
                        {job.shippingInstructionNo && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80" title="Nomor Shipping Instruction">
                            SI: {job.shippingInstructionNo}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                          {job.bizMode || job.transportMode} • {job.bound || job.shipmentType}
                        </span>
                        {job.incoterm && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80">
                            {job.incoterm}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Tercatat pada{" "}
                        {new Date(job.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${statusConfig.classes}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Middle: Shipper, POL -> POD Route, Carrier & BL */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Customer / Shipper */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      Customer / Shipper (AR)
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {job.customerName}
                    </p>
                    <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                      Carrier: {job.vendorName || "Belum Ditunjuk"}
                    </span>
                    {job.billingPartyName && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1 truncate" title={`Tertagih: ${job.billingPartyName} (${job.billingPartyType})`}>
                        Tertagih: {job.billingPartyName}
                      </span>
                    )}
                  </div>

                  {/* POL -> POD Route */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      Rute Pelabuhan (POL → POD)
                    </span>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="font-mono text-violet-600 dark:text-violet-400 truncate max-w-[120px]">
                        {job.originPort}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">
                        {job.destinationPort}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                      {job.vesselOrFlight || "Vessel / Flight TBA"}{" "}
                      {job.voyageOrFlightNo ? `(${job.voyageOrFlightNo})` : ""}
                    </span>
                  </div>

                  {/* Cargo & BL Summary */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      Spesifikasi Kargo &amp; Dokumen BL
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {job.containerSummary ||
                        `${job.packageCount || 0} ${job.packageType || "Koli"} • ${job.grossWeightKg || 0} Kg • ${job.volumeWeightCbm || 0} CBM`}
                    </p>
                    <span className="font-mono text-[11px] text-slate-400 block mt-0.5 truncate">
                      {isAir ? "AWB No" : "B/L No"}:{" "}
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                        {job.masterBillOfLading || "Draft Dokumen Terbit"}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Financial Summary Strip with DISTINCT Action Buttons */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-white/[0.02] dark:to-white/[0.04] border border-slate-100 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Nilai Jual (AR)
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatIDR(job.sellingAmount)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Hutang Vendor (AP)
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {formatIDR(job.buyingAmount)}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                        Gross Margin
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatIDR(job.grossProfit)} ({job.marginPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* ACTION CONTROLS: DIBEDAKAN ANTARA "LIHAT DETAIL", "EDIT", DAN "HAPUS" */}
                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-white/[0.06]">
                    {/* 1. TOMBOL LIHAT DETAIL */}
                    <button
                      type="button"
                      onClick={() => setSelectedDetailJob(job)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/15 transition-all shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Lihat Detail</span>
                    </button>

                    {/* TOMBOL CETAK DRAFT AWB/BL */}
                    <a
                      href={`/api/${tenantSubdomain}/jobs/${job.id}/awb-pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/15 transition-all shadow-2xs"
                      title="Cetak Dokumen Pengiriman (Draft AWB/BL PDF)"
                    >
                      <Printer className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      <span className="hidden sm:inline">Cetak</span>
                      <span>PDF</span>
                    </a>

                    {/* 2. TOMBOL EDIT */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(job)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-2xs transition-all"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* 3. TOMBOL HAPUS */}
                    <button
                      type="button"
                      onClick={() => setDeletingJob(job)}
                      title="Hapus Job File"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Menampilkan <strong className="text-slate-900 dark:text-white">{filteredJobs.length}</strong> Job File operasional
          (Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>)
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`h-7 w-7 rounded-xl text-xs font-bold transition-all ${
                  currentPage === p
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. MODAL LIHAT DETAIL JOB FILE (VIEW DETAILS) */}
      {/* ==================================================================== */}
      {selectedDetailJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#121620] w-full max-w-3xl rounded-3xl border border-slate-200/80 dark:border-white/[0.1] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/30 dark:from-white/[0.02] dark:to-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 font-bold">
                  {selectedDetailJob.bizMode === "AIR" || selectedDetailJob.transportMode === "AIR" ? (
                    <Plane className="h-5 w-5" />
                  ) : (
                    <Ship className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                      {selectedDetailJob.jobFileNumber}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        getStatusBadge(selectedDetailJob.status).classes
                      }`}
                    >
                      {getStatusBadge(selectedDetailJob.status).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Moda: <strong className="text-slate-800 dark:text-slate-200">{selectedDetailJob.bizMode || selectedDetailJob.transportMode}</strong> • Bound:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">{selectedDetailJob.bound || selectedDetailJob.shipmentType}</strong> • Incoterm:{" "}
                    <strong className="text-blue-600 dark:text-blue-400">{selectedDetailJob.incoterm || "FOB"}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailJob(null)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Section 1: Customer & Vendor */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Pihak Terkait (Stakeholders)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08]">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Customer / Shipper (Sisi Selling - AR)
                    </span>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      {selectedDetailJob.customerName}
                    </p>
                    <div className="mt-2 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {selectedDetailJob.customerCode && <div>Kode: {selectedDetailJob.customerCode}</div>}
                      {selectedDetailJob.customerTaxId && <div>NPWP: {selectedDetailJob.customerTaxId}</div>}
                      {selectedDetailJob.customerEmail && <div>Email: {selectedDetailJob.customerEmail}</div>}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08]">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Vendor Carrier / Haulage (Sisi Buying - AP)
                    </span>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      {selectedDetailJob.vendorName || "Belum Ditunjuk / Direct Shipper"}
                    </p>
                    <div className="mt-2 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {selectedDetailJob.vendorCode && <div>Kode: {selectedDetailJob.vendorCode}</div>}
                      <div>Penyedia Kargo Utama (Pelayaran / Maskapai / TPS)</div>
                    </div>
                  </div>

                  {/* Card Consignee & Notify Party */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] sm:col-span-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/50 dark:border-white/[0.05]">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Consignee (Penerima Luar Negeri) &amp; Notify Party
                      </span>
                      {selectedDetailJob.paymentTermMode && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                          {selectedDetailJob.paymentTermMode === "CC" ? "Freight Collect (CC)" : "Freight Prepaid (PP)"}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Nama Penerima</span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {selectedDetailJob.consigneeName || "-"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {selectedDetailJob.consigneeAddress || "-"}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {selectedDetailJob.consigneeCity ? `${selectedDetailJob.consigneeCity}, ` : ""}
                          {selectedDetailJob.consigneeCountry || ""}
                          {selectedDetailJob.consigneePostalCode ? ` ${selectedDetailJob.consigneePostalCode}` : ""}
                        </p>
                        {selectedDetailJob.consigneePhone && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            TEL: {selectedDetailJob.consigneePhone}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Notify Party</span>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {selectedDetailJob.notifyParty || "SAME AS CONSIGNEE"}
                          </strong>
                        </div>
                        {selectedDetailJob.transitPort && (
                          <div>
                            <span className="text-[10px] text-slate-400 block">Hub Transit / Connecting Flight</span>
                            <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
                              {selectedDetailJob.transitPort}
                              {selectedDetailJob.connectingFlightNo ? ` (${selectedDetailJob.connectingFlightNo})` : ""}
                            </strong>
                          </div>
                        )}
                        <div className="flex gap-4 pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Valuasi Carriage</span>
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {selectedDetailJob.declaredValueCarriage || "NVD"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Valuasi Customs</span>
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {selectedDetailJob.declaredValueCustoms || "NCV"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Referensi Dokumen & Billing Party */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] sm:col-span-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/50 dark:border-white/[0.05]">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Dokumen Referensi &amp; Pihak Tertagih (Billing Party)
                      </span>
                      {selectedDetailJob.billingPartyType && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          Billing Role: {selectedDetailJob.billingPartyType}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Ref / Job Order Mitra</span>
                        <p className="font-mono font-bold text-violet-700 dark:text-violet-400 truncate">
                          {selectedDetailJob.customerRefNo || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">No. Shipping Instruction</span>
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                          {selectedDetailJob.shippingInstructionNo || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">No. Commercial Invoice</span>
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                          {selectedDetailJob.commercialInvoiceNo || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Entitas Tertagih (Invoice AR)</span>
                        <p className="font-bold text-emerald-700 dark:text-emerald-400 truncate">
                          {selectedDetailJob.billingPartyName || selectedDetailJob.customerName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Routing & Documents */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Rute Pelabuhan, Armada &amp; Dokumen BL</span>
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        Port of Loading (POL)
                      </span>
                      <p className="text-xs font-bold text-violet-700 dark:text-violet-300 font-mono">
                        {selectedDetailJob.originPort}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        Port of Discharge (POD)
                      </span>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                        {selectedDetailJob.destinationPort}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Vessel / Flight</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {selectedDetailJob.vesselOrFlight || "-"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Voyage / Flight No</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {selectedDetailJob.voyageOrFlightNo || "-"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Master B/L or AWB</span>
                      <div className="flex items-center gap-1">
                        <strong className="font-mono text-violet-600 dark:text-violet-400">
                          {selectedDetailJob.masterBillOfLading || "Draft"}
                        </strong>
                        {selectedDetailJob.masterBillOfLading && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedDetailJob.masterBillOfLading || "");
                              setCopiedBL(true);
                              setTimeout(() => setCopiedBL(false), 2000);
                            }}
                            className="text-slate-400 hover:text-slate-600"
                            title="Salin No BL/AWB"
                          >
                            {copiedBL ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">House B/L or HAWB</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">
                        {selectedDetailJob.houseBillOfLading || "-"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Cargo Details (JobCargoDetail Real Operational Data) */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5" />
                  <span>Rincian Muatan Kargo &amp; Dimensi (Cargo Details)</span>
                </h4>

                {selectedDetailJob.cargoDetails && selectedDetailJob.cargoDetails.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDetailJob.cargoDetails.map((cd) => (
                      <div
                        key={cd.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/50 dark:border-white/[0.05]">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                              {cd.pieces} {cd.unitCode || "Cartons"}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {cd.commodityName || "Kargo Umum"}
                            </span>
                            {cd.hsCode && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60">
                                HS: {cd.hsCode}
                              </span>
                            )}
                          </div>
                          {cd.description && (
                            <span className="text-[11px] text-slate-400 font-mono italic">
                              {cd.description}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Gross Weight</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-mono">
                              {cd.grossWeight.toLocaleString("id-ID")} Kg
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Chargeable Wt</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-mono">
                              {cd.chargeableWeight.toLocaleString("id-ID")} Kg
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Volume (CBM)</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-mono">
                              {cd.volumeCbm.toFixed(3)} CBM
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Dimensi (P x L x T)</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-mono">
                              {cd.length && cd.width && cd.height
                                ? `${cd.length} x ${cd.width} x ${cd.height} cm`
                                : "-"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Muatan</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {selectedDetailJob.packageCount || 1} {selectedDetailJob.packageType || "Koli"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Gross Weight</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {selectedDetailJob.grossWeightKg?.toLocaleString("id-ID") || 0} Kg
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Volume CBM</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                          {selectedDetailJob.volumeWeightCbm?.toFixed(3) || 0} CBM
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Ringkasan Kontainer</span>
                        <strong className="text-slate-800 dark:text-slate-200 truncate block">
                          {selectedDetailJob.containerSummary || "-"}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Financial Summary */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Kalkulasi Finansial (AR vs. AP)</span>
                </h4>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-white/[0.02] dark:to-emerald-950/20 border border-slate-200/80 dark:border-white/[0.08]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Piutang Penjualan (AR)
                      </span>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        {formatIDR(selectedDetailJob.sellingAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Hutang Pokok Vendor (AP)
                      </span>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                        {formatIDR(selectedDetailJob.buyingAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                        Gross Margin Keuntungan
                      </span>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatIDR(selectedDetailJob.grossProfit)} ({selectedDetailJob.marginPercent.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Remarks */}
              {selectedDetailJob.remarks && (
                <div>
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    Catatan Operasional (Remarks)
                  </h4>
                  <p className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-600 dark:text-slate-300 italic">
                    &ldquo;{selectedDetailJob.remarks}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between">
              <span className="text-xs text-slate-400">
                ID Transaksi: <strong className="font-mono">{selectedDetailJob.id}</strong>
              </span>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/${tenantSubdomain}/jobs/${selectedDetailJob.id}/awb-pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/15 shadow-2xs transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Cetak Draft AWB/BL (PDF)</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedDetailJob(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const job = selectedDetailJob;
                    setSelectedDetailJob(null);
                    handleOpenEdit(job);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-xs transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Job File Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. MODAL EDIT JOB FILE */}
      {/* ==================================================================== */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#121620] w-full max-w-2xl rounded-3xl border border-slate-200/80 dark:border-white/[0.1] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-violet-50 to-white dark:from-violet-950/20 dark:to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/20">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Edit Job File: <span className="font-mono text-violet-600 dark:text-violet-400">{editingJob.jobFileNumber}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customer: <strong>{editingJob.customerName}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit}>
              <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                {/* 1. Status & Klasifikasi Operasional */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Operasional *
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, status: e.target.value as JobFileStatus })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-semibold"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="BOOKED">Booked</option>
                      <option value="IN_TRANSIT">In-Transit</option>
                      <option value="CUSTOMS_CLEARANCE">Customs Clearance</option>
                      <option value="ARRIVED">Arrived</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CLOSED">Closed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Biz Mode (Moda)
                    </label>
                    <select
                      value={editFormData.bizMode}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, bizMode: e.target.value as BizMode })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-semibold"
                    >
                      <option value="SEA">Laut (Sea Freight)</option>
                      <option value="AIR">Udara (Air Freight)</option>
                      <option value="INLAND">Darat (Inland Trucking)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Bound (Arah)
                    </label>
                    <select
                      value={editFormData.bound}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, bound: e.target.value as Bound })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-semibold"
                    >
                      <option value="EXPORT">Ekspor (Export)</option>
                      <option value="IMPORT">Impor (Import)</option>
                      <option value="DOMESTIC">Domestik (Domestic)</option>
                    </select>
                  </div>
                </div>

                {/* 2. Incoterm & Exchange Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Incoterm (Kamus Global)
                    </label>
                    <select
                      value={editFormData.incoterm}
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        const matched = masterIncoterms.find((inc) => inc.code === selectedCode);
                        setEditFormData({
                          ...editFormData,
                          incoterm: selectedCode,
                          incotermId: matched ? matched.id : "",
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-semibold"
                    >
                      {masterIncoterms.length > 0 ? (
                        masterIncoterms.map((inc) => (
                          <option key={inc.id} value={inc.code}>
                            {inc.code} - {inc.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="FOB">FOB (Free On Board)</option>
                          <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                          <option value="EXW">EXW (Ex Works)</option>
                          <option value="DDP">DDP (Delivered Duty Paid)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Exchange Rate (Kunci Kurs Valas)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.exchangeRate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, exchangeRate: parseFloat(e.target.value) || 1 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>
                </div>

                {/* 2.1 Dokumen Permintaan & Referensi Klien (Broker & Direct) */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Referensi Dokumen &amp; Brokerage Order
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        No. Referensi Job / PO Klien
                      </label>
                      <input
                        type="text"
                        value={editFormData.customerRefNo}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, customerRefNo: e.target.value })
                        }
                        placeholder="Contoh: JOB-FWD-2026-88"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        No. Shipping Instruction (SI)
                      </label>
                      <input
                        type="text"
                        value={editFormData.shippingInstructionNo}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, shippingInstructionNo: e.target.value })
                        }
                        placeholder="Contoh: SI/2026/10/004"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        No. Commercial Invoice (CI)
                      </label>
                      <input
                        type="text"
                        value={editFormData.commercialInvoiceNo}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, commercialInvoiceNo: e.target.value })
                        }
                        placeholder="Contoh: INV-EXP-2026-042"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2.2 Pihak Tertagih (Billing Party) */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Penetapan Pihak Tertagih (Billing Party Role)
                  </span>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                      Tagihan Diarahkan Kepada
                    </label>
                    <select
                      value={editFormData.billingPartyType}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, billingPartyType: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 font-semibold"
                    >
                      <option value="SHIPPER">Shipper / Eksportir (Freight Prepaid)</option>
                      <option value="CONSIGNEE">Consignee / Importir (Freight Collect)</option>
                      <option value="FORWARDER_PARTNER">Perusahaan Forwarder Mitra (B2B Brokerage)</option>
                      <option value="THIRD_PARTY">Pihak Ketiga Tertunjuk / Agen</option>
                    </select>
                  </div>
                </div>

                {/* 2.5 Penerima Barang (Consignee & Notify Party) */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Penerima Luar Negeri (Consignee) &amp; Notify Party
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        Nama Consignee / Penerima
                      </label>
                      <input
                        type="text"
                        value={editFormData.consigneeName}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, consigneeName: e.target.value })
                        }
                        placeholder="DO THI THAO"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        No. Telepon Penerima
                      </label>
                      <input
                        type="text"
                        value={editFormData.consigneePhone}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, consigneePhone: e.target.value })
                        }
                        placeholder="020-58885793"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        Kota &amp; Negara Penerima
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={editFormData.consigneeCity}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, consigneeCity: e.target.value })
                          }
                          placeholder="Kota (Vientiane)"
                          className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10"
                        />
                        <input
                          type="text"
                          value={editFormData.consigneeCountry}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, consigneeCountry: e.target.value })
                          }
                          placeholder="Negara (LA)"
                          className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10 uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        Notify Party
                      </label>
                      <input
                        type="text"
                        value={editFormData.notifyParty}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, notifyParty: e.target.value })
                        }
                        placeholder="SAME AS CONSIGNEE"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        Alamat Lengkap Consignee
                      </label>
                      <input
                        type="text"
                        value={editFormData.consigneeAddress}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, consigneeAddress: e.target.value })
                        }
                        placeholder="SHENGDA INTERNATIONAL HOTEL, SIKHOTTABONG"
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2130] border border-slate-200 dark:border-white/10"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Armada & Dokumen B/L */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Kapal / Pesawat (Vessel / Flight)
                    </label>
                    <input
                      type="text"
                      value={editFormData.vesselOrFlight}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, vesselOrFlight: e.target.value })
                      }
                      placeholder="Contoh: AIR ASIA AK354 atau MAERSK JAKARTA"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Voyage / Flight No
                    </label>
                    <input
                      type="text"
                      value={editFormData.voyageOrFlightNo}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, voyageOrFlightNo: e.target.value })
                      }
                      placeholder="Contoh: AK354 atau V.2610N"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Master B/L or AWB No
                    </label>
                    <input
                      type="text"
                      value={editFormData.masterBillOfLading}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, masterBillOfLading: e.target.value })
                      }
                      placeholder="Contoh: 80722216040 (Air Asia) atau MSK982347101"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      House B/L or HAWB No
                    </label>
                    <input
                      type="text"
                      value={editFormData.houseBillOfLading}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, houseBillOfLading: e.target.value })
                      }
                      placeholder="Contoh: D1-AIR-2026-001"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-mono"
                    />
                  </div>
                </div>

                {/* 3.5 Hub Transit & Penerbangan Lanjutan */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hub Transit (Transit Port)
                    </label>
                    <input
                      type="text"
                      value={editFormData.transitPort}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, transitPort: e.target.value })
                      }
                      placeholder="KUL - Kuala Lumpur"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Maskapai Lanjutan (2nd Carrier)
                    </label>
                    <input
                      type="text"
                      value={editFormData.secondCarrier}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, secondCarrier: e.target.value })
                      }
                      placeholder="AirAsia Berhad (AK)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Connecting Flight No
                    </label>
                    <input
                      type="text"
                      value={editFormData.connectingFlightNo}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, connectingFlightNo: e.target.value })
                      }
                      placeholder="AK552/14"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-mono"
                    />
                  </div>
                </div>

                {/* 4. Muatan Kargo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah Koli/Pcs
                    </label>
                    <input
                      type="number"
                      value={editFormData.packageCount}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, packageCount: parseInt(e.target.value, 10) || 1 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipe Kemasan
                    </label>
                    <input
                      type="text"
                      value={editFormData.packageType}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, packageType: e.target.value })
                      }
                      placeholder="Cartons / Pallet"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Gross Weight (Kg)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={editFormData.grossWeightKg}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, grossWeightKg: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Volume (CBM)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={editFormData.volumeWeightCbm}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, volumeWeightCbm: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ringkasan Kontainer / Dimensi (Container Summary)
                  </label>
                  <input
                    type="text"
                    value={editFormData.containerSummary}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, containerSummary: e.target.value })
                    }
                    placeholder="Contoh: 60 Cartons Air Freight (40x26x35cm) atau 1x20'DC"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                  />
                </div>

                {/* 5. Nilai Finansial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nilai Jual Customer (AR - Piutang) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editFormData.sellingAmount}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, sellingAmount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hutang Pokok Vendor (AP - Biaya) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editFormData.buyingAmount}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, buyingAmount: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-semibold"
                    />
                  </div>
                </div>

                {/* 6. IATA Valuasi & Handling Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Term (CHGS)
                    </label>
                    <select
                      value={editFormData.paymentTermMode}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, paymentTermMode: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-bold"
                    >
                      <option value="PP">PP - Prepaid</option>
                      <option value="CC">CC - Collect</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Declared Carriage
                    </label>
                    <input
                      type="text"
                      value={editFormData.declaredValueCarriage}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, declaredValueCarriage: e.target.value })
                      }
                      placeholder="NVD"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Declared Customs
                    </label>
                    <input
                      type="text"
                      value={editFormData.declaredValueCustoms}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, declaredValueCustoms: e.target.value })
                      }
                      placeholder="NCV"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Insurance
                    </label>
                    <input
                      type="text"
                      value={editFormData.insuranceAmount}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, insuranceAmount: e.target.value })
                      }
                      placeholder="NIL"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Handling Information (Instruksi AWB)
                  </label>
                  <input
                    type="text"
                    value={editFormData.handlingInformation}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, handlingInformation: e.target.value })
                    }
                    placeholder="PLEASE CONTACT TO OUR CONSIGNEE UPON CARGO ARRIVAL. THANKS"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Operasional (Remarks)
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.remarks}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, remarks: e.target.value })
                    }
                    placeholder="Instruksi penanganan kargo, dokumen PEB/NPE, status karantina..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 shadow-xs"
                >
                  {isPending ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. MODAL KONFIRMASI HAPUS JOB FILE */}
      {/* ==================================================================== */}
      {deletingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#121620] w-full max-w-md rounded-3xl border border-rose-200 dark:border-rose-900/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Hapus Job File
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus Job File{" "}
                <strong className="text-slate-900 dark:text-white font-mono">{deletingJob.jobFileNumber}</strong> (Customer:{" "}
                {deletingJob.customerName})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeletingJob(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Job File"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
