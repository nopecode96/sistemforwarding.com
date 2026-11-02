"use server";

import prisma from "@/lib/prisma";
import {
  PrefixType,
  TransportMode,
  ShipmentType,
  JobFileStatus,
  BizMode,
  Bound,
  BillingPartyType,
  CustomerType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

export interface InitialJobFormData {
  tenant: {
    id: string;
    subdomain: string;
    companyName: string;
  };
  customers: Array<{
    id: string;
    name: string;
    customerCode: string;
    customerType: string;
    taxId?: string | null;
  }>;
  vendors: Array<{
    id: string;
    name: string;
    vendorCode: string;
    category: string;
  }>;
  ports: Array<{
    id: string;
    portCode: string;
    portName: string;
    portType: string;
    city: string;
    countryName: string;
  }>;
  currencies: Array<{
    id: string;
    code: string;
    name: string;
    symbol: string;
    exchangeRate: number;
    isBaseCurrency: boolean;
  }>;
  units: Array<{
    id: string;
    unitCode: string;
    unitName: string;
    category: string;
    unitCategory?: string;
    symbol?: string | null;
    maxWeightKg?: number | null;
    maxVolumeCbm?: number | null;
  }>;
  itemTypes: Array<{
    id: string;
    itemCode: string;
    name: string;
    isDangerousGoods: boolean;
    unNumber: string | null;
    classDg: string | null;
    requiresColdChain: boolean;
    minTemperature: number | null;
    maxTemperature: number | null;
    description: string | null;
  }>;
  commodities?: Array<{
    id: string;
    name: string;
    hsCode: string | null;
  }>;
  provinces: Array<{
    id: string;
    code: string | null;
    name: string;
    cities: Array<{
      id: string;
      name: string;
      districts: Array<{
        id: string;
        name: string;
      }>;
    }>;
  }>;
  dictionaries: {
    incoterms: Array<{ code: string; label: string }>;
    packageTypes: Array<{ code: string; label: string }>;
    currencies: Array<{ code: string; label: string }>;
  };
  previewJobNumber: string;
}

export interface CreateJobFileResult {
  success: boolean;
  jobFileNumber?: string;
  jobFileId?: string;
  error?: string;
}

/**
 * Helper to resolve Tenant from either Subdomain or CUID
 */
async function resolveTenant(tenantIdentifier: string) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ id: tenantIdentifier }, { subdomain: tenantIdentifier }],
    },
  });

  if (!tenant) {
    throw new Error(`Tenant '${tenantIdentifier}' tidak ditemukan dalam database.`);
  }

  return tenant;
}

/**
 * 1. getInitialJobFormData
 * Pulls relational customer list (Selling), vendor list (Buying), master ports,
 * master currencies, master units, and dynamic dictionaries directly from PostgreSQL.
 * Adheres strictly to Golden Rule: Zero Hardcoded dropdown options.
 */
export async function getInitialJobFormData(
  tenantIdentifier: string
): Promise<InitialJobFormData> {
  const tenant = await resolveTenant(tenantIdentifier);

  // Fetch tenant-scoped customers (Selling / AR side)
  const customers = await prisma.masterCustomer.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { id: true, name: true, customerCode: true, customerType: true, taxId: true },
    orderBy: { name: "asc" },
  });

  // Fetch tenant-scoped vendors (Buying / AP side)
  const vendors = await prisma.masterVendor.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { id: true, name: true, vendorCode: true, category: true },
    orderBy: { name: "asc" },
  });

  // Fetch global master ports (UN/LOCODE)
  const ports = await prisma.masterPort.findMany({
    where: { isActive: true },
    select: {
      id: true,
      portCode: true,
      portName: true,
      portType: true,
      city: true,
      countryName: true,
    },
    orderBy: { portCode: "asc" },
  });

  // Fetch master currencies from PostgreSQL (IDR, USD, SGD, EUR)
  const currencyRecords = await prisma.masterCurrency.findMany({
    where: {
      OR: [{ tenantId: tenant.id }, { tenantId: null }],
      isActive: true,
    },
    orderBy: { isBaseCurrency: "desc" },
  });

  const currencies = currencyRecords.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    exchangeRate: Number(c.exchangeRate),
    isBaseCurrency: c.isBaseCurrency,
  }));

  // Fetch master units (UoM) from PostgreSQL (KGS, CBM, TEU, FEU, Cartons, Trips)
  const unitRecords = await prisma.masterUnit.findMany({
    where: { isActive: true },
    orderBy: [{ unitCategory: "asc" }, { unitCode: "asc" }],
  });

  const units = unitRecords.map((u) => ({
    id: u.id,
    unitCode: u.unitCode,
    unitName: u.unitName,
    unitCategory: u.unitCategory,
    category: u.unitCategory, // compatibility
    symbol: u.symbol,
    maxWeightKg: u.maxWeightKg ? Number(u.maxWeightKg) : null,
    maxVolumeCbm: u.maxVolumeCbm ? Number(u.maxVolumeCbm) : null,
  }));

  // Fetch master item types (Commodities) from PostgreSQL
  const itemTypeRecords = await prisma.masterItemType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const itemTypes = itemTypeRecords.map((it) => ({
    id: it.id,
    itemCode: it.itemCode,
    name: it.name,
    isDangerousGoods: it.isDangerousGoods,
    unNumber: it.unNumber,
    classDg: it.classDg,
    requiresColdChain: it.requiresColdChain,
    minTemperature: it.minTemperature ? Number(it.minTemperature) : null,
    maxTemperature: it.maxTemperature ? Number(it.maxTemperature) : null,
    description: it.description,
  }));

  // Fetch master commodities (HS Code reference)
  const commodityRecords = await prisma.masterCommodity.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  const commodities = commodityRecords.map((c) => ({
    id: c.id,
    name: c.name,
    hsCode: c.hsCode,
  }));

  // Fetch system dictionaries for dropdowns
  const dictionaryRecords = await prisma.systemDictionary.findMany({
    where: {
      OR: [{ tenantId: tenant.id }, { tenantId: null }],
      isActive: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  const incoterms = dictionaryRecords
    .filter((d) => d.category === "INCOTERM")
    .map((d) => ({ code: d.code, label: d.label }));

  const packageTypes = dictionaryRecords
    .filter((d) => d.category === "PACKAGE_TYPE")
    .map((d) => ({ code: d.code, label: d.label }));

  const legacyCurrencies = dictionaryRecords
    .filter((d) => d.category === "CURRENCY")
    .map((d) => ({ code: d.code, label: d.label }));

  // Fetch hierarchical geographical data (MasterProvince, MasterCity, MasterDistrict)
  const provinces = await prisma.masterProvince.findMany({
    where: { isActive: true },
    include: {
      cities: {
        where: { isActive: true },
        include: {
          districts: {
            where: { isActive: true },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Generate preview of upcoming Job File number
  const previewJobNumber = await previewNextJobNumber(tenant.id);

  return {
    tenant: {
      id: tenant.id,
      subdomain: tenant.subdomain,
      companyName: tenant.companyName,
    },
    customers,
    vendors,
    ports,
    currencies,
    units,
    itemTypes,
    commodities,
    provinces,
    dictionaries: {
      incoterms,
      packageTypes,
      currencies: legacyCurrencies,
    },
    previewJobNumber,
  };
}

/**
 * Formats a sequence number according to the MasterPrefix pattern and zero-padding.
 */
function formatNumberPattern(
  pattern: string,
  prefixCode: string,
  sequence: number,
  zeroPadding: number
): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const seqStr = String(sequence).padStart(zeroPadding, "0");

  return pattern
    .replace("{PREFIX}", prefixCode)
    .replace("{YEAR}", year)
    .replace("{MONTH}", month)
    .replace("{DAY}", day)
    .replace("{SEQ}", seqStr);
}

/**
 * 2. previewNextJobNumber
 * Peeks the upcoming Job File identifier without incrementing the sequence counter.
 */
export async function previewNextJobNumber(tenantId: string): Promise<string> {
  const prefixConfig = await prisma.masterPrefix.findUnique({
    where: {
      tenantId_prefixType: {
        tenantId,
        prefixType: PrefixType.JOB_FILE,
      },
    },
  });

  if (!prefixConfig) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `JF/${year}/${month}/00001`;
  }

  const nextSeq = prefixConfig.currentSequence + 1;
  return formatNumberPattern(
    prefixConfig.formatPattern,
    prefixConfig.prefixCode,
    nextSeq,
    prefixConfig.zeroPadding
  );
}

/**
 * 3. allocateNextJobNumberAtomic
 * Atomically increments sequence counter in PostgreSQL transaction.
 */
export async function allocateNextJobNumberAtomic(tenantId: string): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    let prefixConfig = await tx.masterPrefix.findUnique({
      where: {
        tenantId_prefixType: {
          tenantId,
          prefixType: PrefixType.JOB_FILE,
        },
      },
    });

    if (!prefixConfig) {
      prefixConfig = await tx.masterPrefix.create({
        data: {
          tenantId,
          prefixType: PrefixType.JOB_FILE,
          prefixCode: "JF",
          zeroPadding: 5,
          currentSequence: 0,
          formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
        },
      });
    }

    const nextSeq = prefixConfig.currentSequence + 1;

    await tx.masterPrefix.update({
      where: { id: prefixConfig.id },
      data: {
        currentSequence: nextSeq,
        lastResetAt: new Date(),
      },
    });

    return formatNumberPattern(
      prefixConfig.formatPattern,
      prefixConfig.prefixCode,
      nextSeq,
      prefixConfig.zeroPadding
    );
  });
}

/**
 * 4. createJobFile
 * Persists complete operational shipment record to PostgreSQL with strict Tenant isolation.
 */
export async function createJobFile(
  prevState: CreateJobFileResult | null,
  formData: FormData
): Promise<CreateJobFileResult> {
  try {
    const tenantIdentifier = formData.get("tenantIdentifier") as string;
    const customerId = formData.get("customerId") as string;
    const vendorId = (formData.get("vendorId") as string) || null;

    if (!tenantIdentifier) {
      return { success: false, error: "Identifikasi Tenant tidak ditemukan." };
    }
    if (!customerId) {
      return { success: false, error: "Pelanggan (Customer / Shipper) wajib dipilih." };
    }

    const tenant = await resolveTenant(tenantIdentifier);

    // Operational Route & Scheduling Attributes
    const customerRefNo = ((formData.get("customerRefNo") as string) || "").trim();
    const shippingInstructionNo = ((formData.get("shippingInstructionNo") as string) || "").trim();
    const commercialInvoiceNo = ((formData.get("commercialInvoiceNo") as string) || "").trim();
    const billingPartyType = (formData.get("billingPartyType") as BillingPartyType) || BillingPartyType.SHIPPER;
    const billingPartyIdInput = (formData.get("billingPartyId") as string) || null;

    let resolvedBillingPartyId = billingPartyIdInput;
    if (!resolvedBillingPartyId || resolvedBillingPartyId === "") {
      if (billingPartyType === BillingPartyType.SHIPPER || billingPartyType === BillingPartyType.FORWARDER_PARTNER) {
        resolvedBillingPartyId = customerId;
      }
    }

    const originPort = ((formData.get("originPort") as string) || "").trim();
    const destinationPort = ((formData.get("destinationPort") as string) || "").trim();
    const originPortIdInput = (formData.get("originPortId") as string) || null;
    const destinationPortIdInput = (formData.get("destinationPortId") as string) || null;

    const vesselOrFlight = ((formData.get("vesselOrFlight") as string) || "").trim();
    const voyageOrFlightNo = ((formData.get("voyageOrFlightNo") as string) || "").trim();
    const transportMode = (formData.get("transportMode") as TransportMode) || TransportMode.SEA;
    const shipmentType = (formData.get("shipmentType") as ShipmentType) || ShipmentType.EXPORT;
    const incoterm = (formData.get("incoterm") as string) || "FOB";

    // Stakeholder Tambahan (Consignee & Notify Party)
    const consigneeName = ((formData.get("consigneeName") as string) || "").trim();
    const consigneeAddress = ((formData.get("consigneeAddress") as string) || "").trim();
    const consigneeCity = ((formData.get("consigneeCity") as string) || "").trim();
    const consigneeCountry = ((formData.get("consigneeCountry") as string) || (shipmentType === "EXPORT" ? "LA" : "ID")).trim();
    const consigneePhone = ((formData.get("consigneePhone") as string) || "").trim();
    const consigneePostalCode = ((formData.get("consigneePostalCode") as string) || "").trim();
    const consigneeTaxId = ((formData.get("consigneeTaxId") as string) || "").trim();
    const consigneeAccountNo = ((formData.get("consigneeAccountNo") as string) || "").trim();
    const notifyParty = ((formData.get("notifyParty") as string) || "").trim();

    // Nomor Dokumen Pengapalan (Master & House)
    const masterBillOfLading = ((formData.get("masterBillOfLading") as string) || "").trim();
    const houseBillOfLading = ((formData.get("houseBillOfLading") as string) || "").trim();

    // Multi-Leg & Transit Routing (Khusus Kargo Udara)
    const transitPort = ((formData.get("transitPort") as string) || "").trim();
    const transitPortId = (formData.get("transitPortId") as string) || null;
    const secondCarrier = ((formData.get("secondCarrier") as string) || "").trim();
    const connectingFlightNo = ((formData.get("connectingFlightNo") as string) || "").trim();

    // IATA Valuasi & Pembayaran
    const paymentTermMode = ((formData.get("paymentTermMode") as string) || "PP").trim();
    const declaredValueCarriage = ((formData.get("declaredValueCarriage") as string) || "NVD").trim();
    const declaredValueCustoms = ((formData.get("declaredValueCustoms") as string) || "NCV").trim();
    const insuranceAmount = ((formData.get("insuranceAmount") as string) || "NIL").trim();
    const handlingInformation = ((formData.get("handlingInformation") as string) || "").trim();

    // Rincian Dimensi Kardus Fisik (P x L x T)
    const cargoLength = parseFloat(formData.get("cargoLength") as string) || null;
    const cargoWidth = parseFloat(formData.get("cargoWidth") as string) || null;
    const cargoHeight = parseFloat(formData.get("cargoHeight") as string) || null;
    const commodityId = (formData.get("commodityId") as string) || null;

    if (!originPort || !destinationPort) {
      return { success: false, error: "Port of Loading dan Port of Discharge wajib dipilih/diisi." };
    }

    // Cargo Specifications, Satuan (MasterUnit) & Komoditas (MasterItemType)
    const packageCount = parseInt(formData.get("packageCount") as string, 10) || 1;
    const packageType = (formData.get("packageType") as string) || "20'DC";
    const packageUnitId = (formData.get("packageUnitId") as string) || null;
    const containerUnitId = (formData.get("containerUnitId") as string) || null;
    const itemTypeId = (formData.get("itemTypeId") as string) || null;
    const grossWeightKg = parseFloat(formData.get("grossWeightKg") as string) || 0;
    const volumeWeightCbm = parseFloat(formData.get("volumeWeightCbm") as string) || 0;
    const containerSummary = ((formData.get("containerSummary") as string) || "").trim();
    const commodityDescription = ((formData.get("commodityDescription") as string) || "").trim();

    // Financial Values & Currency (MasterCurrency)
    const currencyId = (formData.get("currencyId") as string) || null;
    const currencyCode = (formData.get("currency") as string) || "IDR";
    const sellingAmount = parseFloat(formData.get("sellingAmount") as string) || 0;
    const buyingAmount = parseFloat(formData.get("buyingAmount") as string) || 0;
    const remarks = ((formData.get("remarks") as string) || "").trim();

    // Atomically allocate Job File Number and persist within transaction
    const newJob = await prisma.$transaction(async (tx) => {
      // 1. Resolve Port Foreign Keys if available
      let resolvedOriginPortId = originPortIdInput;
      let resolvedDestPortId = destinationPortIdInput;

      if (!resolvedOriginPortId) {
        const portCode = originPort.split(" ")[0].replace(/[^A-Za-z0-9]/g, "");
        const match = await tx.masterPort.findFirst({
          where: { OR: [{ portCode }, { portName: { contains: originPort, mode: "insensitive" } }] },
        });
        if (match) resolvedOriginPortId = match.id;
      }

      if (!resolvedDestPortId) {
        const portCode = destinationPort.split(" ")[0].replace(/[^A-Za-z0-9]/g, "");
        const match = await tx.masterPort.findFirst({
          where: { OR: [{ portCode }, { portName: { contains: destinationPort, mode: "insensitive" } }] },
        });
        if (match) resolvedDestPortId = match.id;
      }

      // 2. Increment sequence & build formatted number
      let prefixConfig = await tx.masterPrefix.findUnique({
        where: {
          tenantId_prefixType: {
            tenantId: tenant.id,
            prefixType: PrefixType.JOB_FILE,
          },
        },
      });

      if (!prefixConfig) {
        prefixConfig = await tx.masterPrefix.create({
          data: {
            tenantId: tenant.id,
            prefixType: PrefixType.JOB_FILE,
            prefixCode: "JF",
            zeroPadding: 5,
            currentSequence: 0,
            formatPattern: "{PREFIX}/{YEAR}/{MONTH}/{SEQ}",
          },
        });
      }

      const nextSequence = prefixConfig.currentSequence + 1;
      await tx.masterPrefix.update({
        where: { id: prefixConfig.id },
        data: { currentSequence: nextSequence },
      });

      const jobFileNumber = formatNumberPattern(
        prefixConfig.formatPattern,
        prefixConfig.prefixCode,
        nextSequence,
        prefixConfig.zeroPadding
      );

      // 3. Insert Job File with strict tenantId foreign key
      const jobRecord = await tx.jobFile.create({
        data: {
          tenantId: tenant.id,
          jobFileNumber,
          customerId,
          vendorId: vendorId && vendorId !== "" ? vendorId : null,
          customerRefNo: customerRefNo || null,
          shippingInstructionNo: shippingInstructionNo || null,
          commercialInvoiceNo: commercialInvoiceNo || null,
          billingPartyType,
          billingPartyId: resolvedBillingPartyId && resolvedBillingPartyId !== "" ? resolvedBillingPartyId : null,
          status: JobFileStatus.DRAFT,
          transportMode,
          shipmentType,
          bizMode: (transportMode as any) || BizMode.SEA,
          bound: (shipmentType as any) || Bound.EXPORT,
          incoterm,
          originPortId: resolvedOriginPortId,
          originPort,
          destinationPortId: resolvedDestPortId,
          destinationPort,
          vesselOrFlight: vesselOrFlight || null,
          voyageOrFlightNo: voyageOrFlightNo || null,
          masterBillOfLading: masterBillOfLading || null,
          houseBillOfLading: houseBillOfLading || null,
          consigneeName: consigneeName || null,
          consigneeAddress: consigneeAddress || null,
          consigneeCity: consigneeCity || null,
          consigneeCountry: consigneeCountry || null,
          consigneePhone: consigneePhone || null,
          consigneePostalCode: consigneePostalCode || null,
          consigneeTaxId: consigneeTaxId || null,
          consigneeAccountNo: consigneeAccountNo || null,
          notifyParty: notifyParty || null,
          transitPort: transitPort || null,
          transitPortId: transitPortId || null,
          secondCarrier: secondCarrier || null,
          connectingFlightNo: connectingFlightNo || null,
          paymentTermMode: paymentTermMode || "PP",
          declaredValueCarriage: declaredValueCarriage || "NVD",
          declaredValueCustoms: declaredValueCustoms || "NCV",
          insuranceAmount: insuranceAmount || "NIL",
          handlingInformation: handlingInformation || null,
          packageCount,
          packageType,
          packageUnitId: packageUnitId && packageUnitId !== "" ? packageUnitId : null,
          containerUnitId: containerUnitId && containerUnitId !== "" ? containerUnitId : null,
          itemTypeId: itemTypeId && itemTypeId !== "" ? itemTypeId : null,
          grossWeightKg,
          volumeWeightCbm,
          containerSummary: containerSummary || null,
          commodityDescription: commodityDescription || null,
          currencyId: currencyId && currencyId !== "" ? currencyId : null,
          currency: currencyCode,
          sellingAmount,
          buyingAmount,
          remarks: remarks || null,
        },
      });

      // 4. Save Cargo Physical Detail if dimensions are provided
      if (cargoLength && cargoWidth && cargoHeight) {
        const divisor = transportMode === TransportMode.AIR ? 6000 : 1000;
        const calcCbm = volumeWeightCbm > 0 ? volumeWeightCbm : (cargoLength * cargoWidth * cargoHeight * packageCount) / 1000000;
        const calcCw = Math.max(grossWeightKg, (cargoLength * cargoWidth * cargoHeight * packageCount) / divisor);

        await tx.jobCargoDetail.create({
          data: {
            jobFileId: jobRecord.id,
            pieces: packageCount,
            grossWeight: grossWeightKg,
            chargeableWeight: calcCw,
            volumeCbm: calcCbm,
            length: cargoLength,
            width: cargoWidth,
            height: cargoHeight,
            unitId: packageUnitId,
            commodityId: commodityId && commodityId !== "" ? commodityId : null,
            description: `${cargoLength} x ${cargoWidth} x ${cargoHeight}CM / ${packageCount}${packageType} - ${commodityDescription || "General Cargo"}`,
          },
        });
      }

      return jobRecord;
    });

    console.info(
      `[JobFile Created] Successfully generated JobFile ${newJob.jobFileNumber} for Tenant ${tenant.subdomain}`
    );

    try {
      revalidatePath(`/${tenant.subdomain}`);
      revalidatePath(`/${tenant.subdomain}/jobs/new`);
      revalidatePath(`/${tenant.subdomain}/finance`);
    } catch {
      // Revalidation during non-request builds is ignored safely
    }

    return {
      success: true,
      jobFileNumber: newJob.jobFileNumber,
      jobFileId: newJob.id,
    };
  } catch (error) {
    console.error("[createJobFile Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan internal saat menyimpan Job File.",
    };
  }
}

/**
 * 5. updateJobFile
 * Updates existing operational Job File attributes with strict tenant isolation.
 */
export interface UpdateJobFileInput {
  id: string;
  tenantSubdomain: string;
  customerRefNo?: string | null;
  shippingInstructionNo?: string | null;
  commercialInvoiceNo?: string | null;
  billingPartyType?: BillingPartyType;
  billingPartyId?: string | null;
  status?: JobFileStatus;
  bizMode?: BizMode;
  bound?: Bound;
  transportMode?: TransportMode;
  shipmentType?: ShipmentType;
  incoterm?: string;
  incotermId?: string | null;
  exchangeRate?: number | null;
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
  grossWeightKg?: number | null;
  volumeWeightCbm?: number | null;
  packageCount?: number | null;
  packageType?: string | null;
  containerSummary?: string | null;
  commodityDescription?: string | null;
  sellingAmount?: number;
  buyingAmount?: number;
  remarks?: string | null;
}

export async function updateJobFile(data: UpdateJobFileInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const tenant = await resolveTenant(data.tenantSubdomain);
    const existingJob = await prisma.jobFile.findFirst({
      where: { id: data.id, tenantId: tenant.id },
    });

    if (!existingJob) {
      return { success: false, error: "Job File tidak ditemukan dalam database tenant ini." };
    }

    const updated = await prisma.jobFile.update({
      where: { id: data.id },
      data: {
        ...(data.customerRefNo !== undefined && { customerRefNo: data.customerRefNo }),
        ...(data.shippingInstructionNo !== undefined && { shippingInstructionNo: data.shippingInstructionNo }),
        ...(data.commercialInvoiceNo !== undefined && { commercialInvoiceNo: data.commercialInvoiceNo }),
        ...(data.billingPartyType && { billingPartyType: data.billingPartyType }),
        ...(data.billingPartyId !== undefined && { billingPartyId: data.billingPartyId }),
        ...(data.status && { status: data.status }),
        ...(data.bizMode && { bizMode: data.bizMode }),
        ...(data.bound && { bound: data.bound }),
        ...(data.transportMode && { transportMode: data.transportMode }),
        ...(data.shipmentType && { shipmentType: data.shipmentType }),
        ...(data.incoterm && { incoterm: data.incoterm }),
        ...(data.incotermId !== undefined && { incotermId: data.incotermId }),
        ...(data.exchangeRate !== undefined && { exchangeRate: data.exchangeRate }),
        ...(data.vesselOrFlight !== undefined && { vesselOrFlight: data.vesselOrFlight }),
        ...(data.voyageOrFlightNo !== undefined && { voyageOrFlightNo: data.voyageOrFlightNo }),
        ...(data.masterBillOfLading !== undefined && { masterBillOfLading: data.masterBillOfLading }),
        ...(data.houseBillOfLading !== undefined && { houseBillOfLading: data.houseBillOfLading }),
        ...(data.consigneeName !== undefined && { consigneeName: data.consigneeName }),
        ...(data.consigneeAddress !== undefined && { consigneeAddress: data.consigneeAddress }),
        ...(data.consigneeCity !== undefined && { consigneeCity: data.consigneeCity }),
        ...(data.consigneeCountry !== undefined && { consigneeCountry: data.consigneeCountry }),
        ...(data.consigneePhone !== undefined && { consigneePhone: data.consigneePhone }),
        ...(data.consigneePostalCode !== undefined && { consigneePostalCode: data.consigneePostalCode }),
        ...(data.consigneeTaxId !== undefined && { consigneeTaxId: data.consigneeTaxId }),
        ...(data.consigneeAccountNo !== undefined && { consigneeAccountNo: data.consigneeAccountNo }),
        ...(data.notifyParty !== undefined && { notifyParty: data.notifyParty }),
        ...(data.transitPort !== undefined && { transitPort: data.transitPort }),
        ...(data.secondCarrier !== undefined && { secondCarrier: data.secondCarrier }),
        ...(data.connectingFlightNo !== undefined && { connectingFlightNo: data.connectingFlightNo }),
        ...(data.paymentTermMode !== undefined && { paymentTermMode: data.paymentTermMode }),
        ...(data.declaredValueCarriage !== undefined && { declaredValueCarriage: data.declaredValueCarriage }),
        ...(data.declaredValueCustoms !== undefined && { declaredValueCustoms: data.declaredValueCustoms }),
        ...(data.insuranceAmount !== undefined && { insuranceAmount: data.insuranceAmount }),
        ...(data.handlingInformation !== undefined && { handlingInformation: data.handlingInformation }),
        ...(data.grossWeightKg !== undefined && { grossWeightKg: data.grossWeightKg }),
        ...(data.volumeWeightCbm !== undefined && { volumeWeightCbm: data.volumeWeightCbm }),
        ...(data.packageCount !== undefined && { packageCount: data.packageCount }),
        ...(data.packageType !== undefined && { packageType: data.packageType }),
        ...(data.containerSummary !== undefined && { containerSummary: data.containerSummary }),
        ...(data.commodityDescription !== undefined && { commodityDescription: data.commodityDescription }),
        ...(data.sellingAmount !== undefined && { sellingAmount: data.sellingAmount }),
        ...(data.buyingAmount !== undefined && { buyingAmount: data.buyingAmount }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
      },
    });

    safeRevalidate(`/${tenant.subdomain}`);
    safeRevalidate(`/${tenant.subdomain}/jobs`);
    safeRevalidate(`/${tenant.subdomain}/finance`);

    return {
      success: true,
      message: `Job File ${updated.jobFileNumber} berhasil diperbarui.`,
    };
  } catch (error) {
    console.error("[updateJobFile Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui Job File.",
    };
  }
}

/**
 * 6. deleteJobFile
 * Safely deletes a Job File if not referenced by any commercial invoices.
 */
export async function deleteJobFile(
  id: string,
  tenantSubdomain: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);
    const existingJob = await prisma.jobFile.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        invoices: {
          select: { id: true, invoiceNumber: true },
        },
      },
    });

    if (!existingJob) {
      return { success: false, error: "Job File tidak ditemukan dalam database tenant ini." };
    }

    if (existingJob.invoices.length > 0) {
      const invoiceNums = existingJob.invoices.map((inv) => inv.invoiceNumber).join(", ");
      return {
        success: false,
        error: `Job File ${existingJob.jobFileNumber} tidak dapat dihapus karena telah diterbitkan faktur penagihan (${invoiceNums}). Batalkan invoice terlebih dahulu.`,
      };
    }

    // Delete child cargo details first
    await prisma.jobCargoDetail.deleteMany({
      where: { jobFileId: id },
    });

    await prisma.jobFile.delete({
      where: { id },
    });

    safeRevalidate(`/${tenant.subdomain}`);
    safeRevalidate(`/${tenant.subdomain}/jobs`);
    safeRevalidate(`/${tenant.subdomain}/finance`);

    return {
      success: true,
      message: `Job File ${existingJob.jobFileNumber} berhasil dihapus dari sistem.`,
    };
  } catch (error) {
    console.error("[deleteJobFile Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus Job File.",
    };
  }
}
