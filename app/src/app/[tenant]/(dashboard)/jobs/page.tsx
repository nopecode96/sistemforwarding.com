export const dynamic = "force-dynamic";

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { JobFileList } from "@/components/tenant/JobFileList";
import { Ship, TrendingUp, Clock, FileCheck2, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface JobsPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function TenantJobsPage({ params }: JobsPageProps) {
  const { tenant: subdomain } = await params;

  // 1. Resolve tenant
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: {
      id: true,
      subdomain: true,
      companyName: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  // 2. Fetch live job files from PostgreSQL (Strict Zero Mock Data)
  const [jobRecords, incoterms] = await Promise.all([
    prisma.jobFile.findMany({
      where: { tenantId: tenant.id },
      include: {
        customer: { select: { id: true, name: true, customerCode: true, taxId: true, email: true, phone: true } },
        vendor: { select: { id: true, name: true, vendorCode: true, category: true } },
        originPortRef: { select: { portCode: true, portName: true, city: true, countryName: true } },
        destinationPortRef: { select: { portCode: true, portName: true, city: true, countryName: true } },
        incotermRef: { select: { id: true, code: true, name: true } },
        itemTypeRef: { select: { id: true, itemCode: true, name: true } },
        packageUnitRef: { select: { id: true, unitCode: true, unitName: true } },
        containerUnitRef: { select: { id: true, unitCode: true, unitName: true } },
        cargoDetails: {
          include: {
            unitRef: { select: { unitCode: true, unitName: true } },
            commodityRef: { select: { name: true, hsCode: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.masterIncoterm.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);

  // Calculate metrics
  const totalJobs = jobRecords.length;
  const inTransitCount = jobRecords.filter((j) => j.status === "IN_TRANSIT").length;
  const totalRevenue = jobRecords.reduce((acc, j) => acc + Number(j.sellingAmount), 0);
  const totalCost = jobRecords.reduce((acc, j) => acc + Number(j.buyingAmount), 0);
  const grossProfit = totalRevenue - totalCost;
  const overallMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const formattedJobs = jobRecords.map((j) => {
    const selling = Number(j.sellingAmount) || 0;
    const buying = Number(j.buyingAmount) || 0;
    const profit = selling - buying;
    const margin = selling > 0 ? (profit / selling) * 100 : 0;

    return {
      id: j.id,
      jobFileNumber: j.jobFileNumber,
      customerName: j.customer?.name || "Customer",
      customerCode: j.customer?.customerCode,
      customerTaxId: j.customer?.taxId || null,
      customerEmail: j.customer?.email || null,
      customerPhone: j.customer?.phone || null,
      vendorName: j.vendor?.name || undefined,
      vendorCode: j.vendor?.vendorCode || undefined,
      status: j.status,
      transportMode: j.transportMode,
      bizMode: j.bizMode || (j.transportMode === "AIR" ? "AIR" : "SEA"),
      bound: j.bound || (j.shipmentType === "IMPORT" ? "IMPORT" : "EXPORT"),
      shipmentType: j.shipmentType,
      incoterm: j.incoterm || j.incotermRef?.code || "FOB",
      incotermId: j.incotermId,
      incotermName: j.incotermRef?.name || null,
      exchangeRate: j.exchangeRate ? Number(j.exchangeRate) : null,
      originPort: j.originPort,
      originPortDetails: j.originPortRef,
      destinationPort: j.destinationPort,
      destinationPortDetails: j.destinationPortRef,
      vesselOrFlight: j.vesselOrFlight,
      voyageOrFlightNo: j.voyageOrFlightNo,
      masterBillOfLading: j.masterBillOfLading,
      houseBillOfLading: j.houseBillOfLading,
      consigneeName: j.consigneeName || null,
      consigneeAddress: j.consigneeAddress || null,
      consigneeCity: j.consigneeCity || null,
      consigneeCountry: j.consigneeCountry || null,
      consigneePhone: j.consigneePhone || null,
      consigneePostalCode: j.consigneePostalCode || null,
      consigneeTaxId: j.consigneeTaxId || null,
      consigneeAccountNo: j.consigneeAccountNo || null,
      notifyParty: j.notifyParty || null,
      transitPort: j.transitPort || null,
      secondCarrier: j.secondCarrier || null,
      connectingFlightNo: j.connectingFlightNo || null,
      paymentTermMode: j.paymentTermMode || "PP",
      declaredValueCarriage: j.declaredValueCarriage || "NVD",
      declaredValueCustoms: j.declaredValueCustoms || "NCV",
      insuranceAmount: j.insuranceAmount || "NIL",
      handlingInformation: j.handlingInformation || null,
      containerSummary: j.containerSummary,
      packageCount: j.packageCount,
      packageType: j.packageType,
      commodityDescription: j.commodityDescription,
      grossWeightKg: j.grossWeightKg ? Number(j.grossWeightKg) : null,
      volumeWeightCbm: j.volumeWeightCbm ? Number(j.volumeWeightCbm) : null,
      sellingAmount: selling,
      buyingAmount: buying,
      grossProfit: profit,
      marginPercent: margin,
      remarks: j.remarks,
      createdAt: j.createdAt.toISOString(),
      cargoDetails: j.cargoDetails.map((cd) => ({
        id: cd.id,
        pieces: cd.pieces,
        grossWeight: Number(cd.grossWeight),
        chargeableWeight: Number(cd.chargeableWeight),
        volumeCbm: Number(cd.volumeCbm),
        length: cd.length ? Number(cd.length) : null,
        width: cd.width ? Number(cd.width) : null,
        height: cd.height ? Number(cd.height) : null,
        description: cd.description,
        unitCode: cd.unitRef?.unitCode || null,
        unitName: cd.unitRef?.unitName || null,
        commodityName: cd.commodityRef?.name || null,
        hsCode: cd.commodityRef?.hsCode || null,
      })),
    };
  });

  return (
    <div className="w-full min-w-0 space-y-6 font-sans">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Manajemen Muatan &amp; Pengiriman</span>
          <span>•</span>
          <span className="font-semibold text-violet-600 dark:text-violet-400 font-mono">
            {tenant.subdomain}.sistemforwarding.com
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Job File Operasional
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Pantau status BL kargo laut dan kargo udara internasional dari pelabuhan muat hingga pelabuhan bongkar.
            </p>
          </div>
        </div>
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Job Files */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Job Files
            </span>
            <div className="h-8 w-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
              <Ship className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalJobs}
          </p>
          <span className="text-[10px] text-slate-400">Total Transaksi Kargo</span>
        </div>

        {/* In-Transit Cargo */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Muatan In-Transit
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {inTransitCount}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Pelayaran Sedang Bergerak</span>
        </div>

        {/* Total Omset Piutang */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Nilai Piutang AR
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-2 truncate">
            {formatIDR(totalRevenue)}
          </p>
          <span className="text-[10px] text-slate-400">Billing Customer Aktif</span>
        </div>

        {/* Estimasi Gross Margin */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Gross Margin
            </span>
            <div className="h-8 w-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {formatIDR(grossProfit)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold">Margin Rata-rata: {overallMargin.toFixed(1)}%</span>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">
              Memuat daftar Job File dari database...
            </p>
          </div>
        }
      >
        <JobFileList
          tenantSubdomain={tenant.subdomain}
          initialJobs={formattedJobs}
          masterIncoterms={incoterms}
        />
      </Suspense>
    </div>
  );
}
