"use server";

import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { PortType, TransportMode, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "./adminAuditActions";

/**
 * Enforces Super Administrator session boundary.
 */
async function requireSuperAdmin() {
  if (process.env.ADMIN_TEST_MODE === "true") {
    return {
      userId: "test-superadmin-id",
      email: "superadmin@sistemforwarding.com",
      name: "Test SuperAdmin",
      role: "SUPERADMIN" as const,
      tenantId: null,
    };
  }

  const session = await getCurrentSession();
  if (!session || (session.role !== "SUPERADMIN" && !session.originalSuperAdmin)) {
    throw new Error(
      "Akses ditolak: Operasi ini membutuhkan hak istimewa Super Administrator."
    );
  }
  return session;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

// ==============================================================================
// 1. GLOBAL PORTS & AIRPORTS (UN/LOCODE)
// ==============================================================================

export interface AdminPortItem {
  id: string;
  portCode: string;
  portName: string;
  portType: PortType;
  city: string;
  countryCode: string;
  countryName: string;
  isMajor: boolean;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  jobFilesCount?: number;
  routesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPortInput {
  id?: string;
  portCode: string;
  portName: string;
  portType: PortType;
  city: string;
  countryCode: string;
  countryName: string;
  isMajor?: boolean;
  isActive?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Ensures standard default ports exist in DB.
 */
async function ensureDefaultPorts() {
  const count = await prisma.masterPort.count();
  if (count > 0) return;

  const defaultPorts = [
    {
      portCode: "IDJKT",
      portName: "Tanjung Priok Port",
      portType: PortType.SEA_PORT,
      city: "Jakarta",
      countryCode: "ID",
      countryName: "Indonesia",
      latitude: -6.1042,
      longitude: 106.8833,
      isMajor: true,
    },
    {
      portCode: "IDCGK",
      portName: "Soekarno-Hatta Int'l Airport Cargo Terminal",
      portType: PortType.AIR_PORT,
      city: "Tangerang / Jakarta",
      countryCode: "ID",
      countryName: "Indonesia",
      latitude: -6.1256,
      longitude: 106.6559,
      isMajor: true,
    },
    {
      portCode: "IDSUB",
      portName: "Tanjung Perak Port",
      portType: PortType.SEA_PORT,
      city: "Surabaya",
      countryCode: "ID",
      countryName: "Indonesia",
      latitude: -7.1994,
      longitude: 112.7303,
      isMajor: true,
    },
    {
      portCode: "SGSIN",
      portName: "Port of Singapore (PSA)",
      portType: PortType.SEA_PORT,
      city: "Singapore",
      countryCode: "SG",
      countryName: "Singapore",
      latitude: 1.2644,
      longitude: 103.8222,
      isMajor: true,
    },
    {
      portCode: "SIN",
      portName: "Singapore Changi Airport Air Cargo Complex",
      portType: PortType.AIR_PORT,
      city: "Singapore",
      countryCode: "SG",
      countryName: "Singapore",
      latitude: 1.3644,
      longitude: 103.9915,
      isMajor: true,
    },
    {
      portCode: "NLRTM",
      portName: "Port of Rotterdam (Maasvlakte)",
      portType: PortType.SEA_PORT,
      city: "Rotterdam",
      countryCode: "NL",
      countryName: "Netherlands",
      latitude: 51.9244,
      longitude: 4.4777,
      isMajor: true,
    },
    {
      portCode: "USNYC",
      portName: "Port of New York & New Jersey",
      portType: PortType.SEA_PORT,
      city: "New York / Newark",
      countryCode: "US",
      countryName: "United States",
      latitude: 40.6892,
      longitude: -74.0445,
      isMajor: true,
    },
    {
      portCode: "CNSHA",
      portName: "Port of Shanghai (Yangshan)",
      portType: PortType.SEA_PORT,
      city: "Shanghai",
      countryCode: "CN",
      countryName: "China",
      latitude: 31.2304,
      longitude: 121.4737,
      isMajor: true,
    },
  ];

  for (const p of defaultPorts) {
    await prisma.masterPort.upsert({
      where: { portCode: p.portCode },
      update: {},
      create: p,
    });
  }
}

/**
 * Lists UN/LOCODE ports & airports with search & filtering.
 */
export async function getGlobalPorts(params?: {
  search?: string;
  portType?: PortType;
  page?: number;
  pageSize?: number;
}): Promise<{
  ports: AdminPortItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await requireSuperAdmin();
  await ensureDefaultPorts();

  const search = params?.search?.trim() || "";
  const portType = params?.portType;
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, Math.min(100, params?.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.MasterPortWhereInput = {};
  if (portType) {
    where.portType = portType;
  }
  if (search) {
    where.OR = [
      { portCode: { contains: search, mode: "insensitive" } },
      { portName: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { countryName: { contains: search, mode: "insensitive" } },
      { countryCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.masterPort.count({ where }),
    prisma.masterPort.findMany({
      where,
      include: {
        _count: {
          select: {
            originJobFiles: true,
            destinationJobFiles: true,
            originRoutes: true,
            destinationRoutes: true,
          },
        },
      },
      orderBy: [{ isMajor: "desc" }, { portCode: "asc" }],
      skip,
      take: pageSize,
    }),
  ]);

  const ports: AdminPortItem[] = rows.map((r) => ({
    id: r.id,
    portCode: r.portCode,
    portName: r.portName,
    portType: r.portType,
    city: r.city,
    countryCode: r.countryCode,
    countryName: r.countryName,
    isMajor: r.isMajor,
    isActive: r.isActive,
    latitude: r.latitude ? Number(r.latitude) : null,
    longitude: r.longitude ? Number(r.longitude) : null,
    jobFilesCount: r._count.originJobFiles + r._count.destinationJobFiles,
    routesCount: r._count.originRoutes + r._count.destinationRoutes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return {
    ports,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

/**
 * Creates or updates a global port/airport.
 */
export async function upsertGlobalPort(input: UpsertPortInput): Promise<ActionResult<AdminPortItem>> {
  const operator = await requireSuperAdmin();

  const portCode = input.portCode.trim().toUpperCase();
  const portName = input.portName.trim();
  const city = input.city.trim();
  const countryCode = input.countryCode.trim().toUpperCase();
  const countryName = input.countryName.trim();

  if (!portCode || !portName || !city || !countryCode || !countryName) {
    return {
      success: false,
      error: "Kode port (UN/LOCODE), nama port, kota, dan negara wajib diisi.",
    };
  }

  // Check unique code collision
  const existingWithCode = await prisma.masterPort.findUnique({
    where: { portCode },
  });

  if (existingWithCode && (!input.id || existingWithCode.id !== input.id)) {
    return {
      success: false,
      error: `Kode pelabuhan/bandara ${portCode} sudah terdaftar di sistem.`,
    };
  }

  let portRecord;
  const isCreate = !input.id;

  if (input.id) {
    portRecord = await prisma.masterPort.update({
      where: { id: input.id },
      data: {
        portCode,
        portName,
        portType: input.portType,
        city,
        countryCode,
        countryName,
        isMajor: input.isMajor ?? true,
        isActive: input.isActive ?? true,
        latitude: input.latitude !== undefined ? input.latitude : undefined,
        longitude: input.longitude !== undefined ? input.longitude : undefined,
      },
    });

    await recordAuditLog({
      action: "PORT_UPDATE",
      targetType: "MASTER_PORT",
      targetId: portRecord.id,
      targetName: `${portRecord.portCode} - ${portRecord.portName}`,
      details: {
        portCode,
        portName,
        portType: input.portType,
        city,
        countryCode,
      },
      operatorId: operator.userId,
      operatorEmail: operator.email,
      operatorName: operator.name,
    });
  } else {
    portRecord = await prisma.masterPort.create({
      data: {
        portCode,
        portName,
        portType: input.portType,
        city,
        countryCode,
        countryName,
        isMajor: input.isMajor ?? true,
        isActive: input.isActive ?? true,
        latitude: input.latitude !== undefined ? input.latitude : null,
        longitude: input.longitude !== undefined ? input.longitude : null,
      },
    });

    await recordAuditLog({
      action: "PORT_CREATE",
      targetType: "MASTER_PORT",
      targetId: portRecord.id,
      targetName: `${portRecord.portCode} - ${portRecord.portName}`,
      details: {
        portCode,
        portName,
        portType: input.portType,
        city,
        countryCode,
      },
      operatorId: operator.userId,
      operatorEmail: operator.email,
      operatorName: operator.name,
    });
  }

  try {
    revalidatePath("/admin/master-data");
    revalidatePath("/master-data");
  } catch {
    // safe fallback
  }

  return {
    success: true,
    message: isCreate
      ? `Pelabuhan/bandara ${portCode} berhasil ditambahkan.`
      : `Pelabuhan/bandara ${portCode} berhasil diperbarui.`,
    data: {
      id: portRecord.id,
      portCode: portRecord.portCode,
      portName: portRecord.portName,
      portType: portRecord.portType,
      city: portRecord.city,
      countryCode: portRecord.countryCode,
      countryName: portRecord.countryName,
      isMajor: portRecord.isMajor,
      isActive: portRecord.isActive,
      latitude: portRecord.latitude ? Number(portRecord.latitude) : null,
      longitude: portRecord.longitude ? Number(portRecord.longitude) : null,
      createdAt: portRecord.createdAt.toISOString(),
      updatedAt: portRecord.updatedAt.toISOString(),
    },
  };
}

/**
 * Deletes a global port with foreign key reference safety.
 */
export async function deleteGlobalPort(id: string): Promise<ActionResult> {
  const operator = await requireSuperAdmin();

  const port = await prisma.masterPort.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          originJobFiles: true,
          destinationJobFiles: true,
          transitJobFiles: true,
        },
      },
    },
  });

  if (!port) {
    return { success: false, error: "Pelabuhan tidak ditemukan." };
  }

  const linkedJobsCount =
    port._count.originJobFiles +
    port._count.destinationJobFiles +
    port._count.transitJobFiles;

  if (linkedJobsCount > 0) {
    return {
      success: false,
      error: `Tidak dapat menghapus pelabuhan ${port.portCode} karena sedang digunakan oleh ${linkedJobsCount} Job File operasional kargo. Anda dapat menonaktifkan statusnya.`,
    };
  }

  await prisma.masterPort.delete({ where: { id } });

  await recordAuditLog({
    action: "PORT_DELETE",
    targetType: "MASTER_PORT",
    targetId: port.id,
    targetName: `${port.portCode} - ${port.portName}`,
    details: { portCode: port.portCode, portName: port.portName },
    operatorId: operator.userId,
    operatorEmail: operator.email,
    operatorName: operator.name,
  });

  try {
    revalidatePath("/admin/master-data");
    revalidatePath("/master-data");
  } catch {
    // safe fallback
  }

  return {
    success: true,
    message: `Pelabuhan/bandara ${port.portCode} berhasil dihapus.`,
  };
}

// ==============================================================================
// 2. GLOBAL CARRIERS (Shipping Lines & Airlines)
// ==============================================================================

export interface AdminCarrierItem {
  id: string;
  carrierCode: string;
  carrierName: string;
  mode: TransportMode;
  scacCode: string | null;
  iataCode: string | null;
  country: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCarrierInput {
  id?: string;
  carrierCode: string;
  carrierName: string;
  mode: TransportMode;
  scacCode?: string | null;
  iataCode?: string | null;
  country?: string | null;
  website?: string | null;
  isActive?: boolean;
}

/**
 * Ensures standard default carriers exist in DB.
 */
async function ensureDefaultCarriers() {
  const count = await prisma.globalCarrier.count();
  if (count > 0) return;

  const defaultCarriers = [
    {
      carrierCode: "MSK",
      carrierName: "Maersk Line (A.P. Moller)",
      mode: TransportMode.SEA,
      scacCode: "MAEU",
      iataCode: null,
      country: "DK",
      website: "https://www.maersk.com",
      isActive: true,
    },
    {
      carrierCode: "MSC",
      carrierName: "Mediterranean Shipping Company (MSC)",
      mode: TransportMode.SEA,
      scacCode: "MSCU",
      iataCode: null,
      country: "CH",
      website: "https://www.msc.com",
      isActive: true,
    },
    {
      carrierCode: "CMA",
      carrierName: "CMA CGM Group",
      mode: TransportMode.SEA,
      scacCode: "CMDU",
      iataCode: null,
      country: "FR",
      website: "https://www.cma-cgm.com",
      isActive: true,
    },
    {
      carrierCode: "EMC",
      carrierName: "Evergreen Marine Corporation",
      mode: TransportMode.SEA,
      scacCode: "EGLV",
      iataCode: null,
      country: "TW",
      website: "https://www.evergreen-marine.com",
      isActive: true,
    },
    {
      carrierCode: "ONE",
      carrierName: "Ocean Network Express (ONE)",
      mode: TransportMode.SEA,
      scacCode: "ONEY",
      iataCode: null,
      country: "JP",
      website: "https://www.one-line.com",
      isActive: true,
    },
    {
      carrierCode: "GA",
      carrierName: "Garuda Indonesia Cargo",
      mode: TransportMode.AIR,
      scacCode: null,
      iataCode: "GA",
      country: "ID",
      website: "https://cargo.garuda-indonesia.com",
      isActive: true,
    },
    {
      carrierCode: "SQ",
      carrierName: "Singapore Airlines Cargo",
      mode: TransportMode.AIR,
      scacCode: null,
      iataCode: "SQ",
      country: "SG",
      website: "https://www.siacargo.com",
      isActive: true,
    },
    {
      carrierCode: "CX",
      carrierName: "Cathay Cargo",
      mode: TransportMode.AIR,
      scacCode: null,
      iataCode: "CX",
      country: "HK",
      website: "https://www.cathaycargo.com",
      isActive: true,
    },
    {
      carrierCode: "EK",
      carrierName: "Emirates SkyCargo",
      mode: TransportMode.AIR,
      scacCode: null,
      iataCode: "EK",
      country: "AE",
      website: "https://www.skycargo.com",
      isActive: true,
    },
  ];

  for (const c of defaultCarriers) {
    await prisma.globalCarrier.upsert({
      where: { carrierCode: c.carrierCode },
      update: {},
      create: c,
    });

    // Also mirror to SystemDictionary category CARRIER
    const existingDict = await prisma.systemDictionary.findFirst({
      where: {
        tenantId: null,
        category: "CARRIER",
        code: c.carrierCode,
      },
    });

    if (existingDict) {
      await prisma.systemDictionary.update({
        where: { id: existingDict.id },
        data: {
          label: c.carrierName,
          isActive: c.isActive,
          metadata: {
            mode: c.mode,
            scacCode: c.scacCode,
            iataCode: c.iataCode,
            country: c.country,
          },
        },
      });
    } else {
      await prisma.systemDictionary.create({
        data: {
          tenantId: null,
          category: "CARRIER",
          code: c.carrierCode,
          label: c.carrierName,
          isActive: c.isActive,
          metadata: {
            mode: c.mode,
            scacCode: c.scacCode,
            iataCode: c.iataCode,
            country: c.country,
          },
        },
      });
    }
  }
}

/**
 * Lists global carriers (shipping lines & airlines).
 */
export async function getGlobalCarriers(params?: {
  search?: string;
  mode?: TransportMode;
  page?: number;
  pageSize?: number;
}): Promise<{
  carriers: AdminCarrierItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await requireSuperAdmin();
  await ensureDefaultCarriers();

  const search = params?.search?.trim() || "";
  const mode = params?.mode;
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, Math.min(100, params?.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.GlobalCarrierWhereInput = {};
  if (mode) {
    where.mode = mode;
  }
  if (search) {
    where.OR = [
      { carrierCode: { contains: search, mode: "insensitive" } },
      { carrierName: { contains: search, mode: "insensitive" } },
      { scacCode: { contains: search, mode: "insensitive" } },
      { iataCode: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.globalCarrier.count({ where }),
    prisma.globalCarrier.findMany({
      where,
      orderBy: [{ mode: "asc" }, { carrierCode: "asc" }],
      skip,
      take: pageSize,
    }),
  ]);

  const carriers: AdminCarrierItem[] = rows.map((r) => ({
    id: r.id,
    carrierCode: r.carrierCode,
    carrierName: r.carrierName,
    mode: r.mode,
    scacCode: r.scacCode,
    iataCode: r.iataCode,
    country: r.country,
    website: r.website,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return {
    carriers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

/**
 * Creates or updates a global carrier.
 */
export async function upsertGlobalCarrier(input: UpsertCarrierInput): Promise<ActionResult<AdminCarrierItem>> {
  const operator = await requireSuperAdmin();

  const carrierCode = input.carrierCode.trim().toUpperCase();
  const carrierName = input.carrierName.trim();
  const scacCode = input.scacCode ? input.scacCode.trim().toUpperCase() : null;
  const iataCode = input.iataCode ? input.iataCode.trim().toUpperCase() : null;
  const country = input.country ? input.country.trim().toUpperCase() : null;
  const website = input.website ? input.website.trim() : null;

  if (!carrierCode || !carrierName) {
    return {
      success: false,
      error: "Kode maskapai/pelayaran dan nama perusahaan wajib diisi.",
    };
  }

  const existingWithCode = await prisma.globalCarrier.findUnique({
    where: { carrierCode },
  });

  if (existingWithCode && (!input.id || existingWithCode.id !== input.id)) {
    return {
      success: false,
      error: `Kode carrier ${carrierCode} sudah terdaftar di sistem.`,
    };
  }

  let carrierRecord;
  const isCreate = !input.id;
  let previousCarrierCode = carrierCode;

  if (input.id) {
    const existingCarrier = await prisma.globalCarrier.findUnique({
      where: { id: input.id },
    });
    if (!existingCarrier) {
      return {
        success: false,
        error: "Carrier tidak ditemukan.",
      };
    }
    previousCarrierCode = existingCarrier.carrierCode;

    carrierRecord = await prisma.globalCarrier.update({
      where: { id: input.id },
      data: {
        carrierCode,
        carrierName,
        mode: input.mode,
        scacCode,
        iataCode,
        country,
        website,
        isActive: input.isActive ?? true,
      },
    });

    await recordAuditLog({
      action: "CARRIER_UPDATE",
      targetType: "GLOBAL_CARRIER",
      targetId: carrierRecord.id,
      targetName: `${carrierRecord.carrierCode} - ${carrierRecord.carrierName}`,
      details: { carrierCode, carrierName, mode: input.mode },
      operatorId: operator.userId,
      operatorEmail: operator.email,
      operatorName: operator.name,
    });
  } else {
    carrierRecord = await prisma.globalCarrier.create({
      data: {
        carrierCode,
        carrierName,
        mode: input.mode,
        scacCode,
        iataCode,
        country,
        website,
        isActive: input.isActive ?? true,
      },
    });

    await recordAuditLog({
      action: "CARRIER_CREATE",
      targetType: "GLOBAL_CARRIER",
      targetId: carrierRecord.id,
      targetName: `${carrierRecord.carrierCode} - ${carrierRecord.carrierName}`,
      details: { carrierCode, carrierName, mode: input.mode },
      operatorId: operator.userId,
      operatorEmail: operator.email,
      operatorName: operator.name,
    });
  }

  // Also sync to SystemDictionary using previousCarrierCode for update lookup
  const existingDict = await prisma.systemDictionary.findFirst({
    where: { tenantId: null, category: "CARRIER", code: previousCarrierCode },
  });
  if (existingDict) {
    await prisma.systemDictionary.update({
      where: { id: existingDict.id },
      data: {
        code: carrierCode,
        label: carrierName,
        isActive: input.isActive ?? true,
        metadata: { mode: input.mode, scacCode, iataCode, country },
      },
    });
  } else {
    await prisma.systemDictionary.create({
      data: {
        tenantId: null,
        category: "CARRIER",
        code: carrierCode,
        label: carrierName,
        isActive: input.isActive ?? true,
        metadata: { mode: input.mode, scacCode, iataCode, country },
      },
    });
  }

  try {
    revalidatePath("/admin/master-data");
    revalidatePath("/master-data");
  } catch {
    // safe fallback
  }

  return {
    success: true,
    message: isCreate
      ? `Carrier ${carrierCode} (${carrierName}) berhasil ditambahkan.`
      : `Carrier ${carrierCode} (${carrierName}) berhasil diperbarui.`,
    data: {
      id: carrierRecord.id,
      carrierCode: carrierRecord.carrierCode,
      carrierName: carrierRecord.carrierName,
      mode: carrierRecord.mode,
      scacCode: carrierRecord.scacCode,
      iataCode: carrierRecord.iataCode,
      country: carrierRecord.country,
      website: carrierRecord.website,
      isActive: carrierRecord.isActive,
      createdAt: carrierRecord.createdAt.toISOString(),
      updatedAt: carrierRecord.updatedAt.toISOString(),
    },
  };
}

/**
 * Deletes a global carrier.
 */
export async function deleteGlobalCarrier(id: string): Promise<ActionResult> {
  const operator = await requireSuperAdmin();

  const carrier = await prisma.globalCarrier.findUnique({
    where: { id },
  });

  if (!carrier) {
    return { success: false, error: "Carrier tidak ditemukan." };
  }

  await prisma.globalCarrier.delete({ where: { id } });

  // Clean from SystemDictionary
  await prisma.systemDictionary.deleteMany({
    where: { tenantId: null, category: "CARRIER", code: carrier.carrierCode },
  });

  await recordAuditLog({
    action: "CARRIER_DELETE",
    targetType: "GLOBAL_CARRIER",
    targetId: carrier.id,
    targetName: `${carrier.carrierCode} - ${carrier.carrierName}`,
    details: { carrierCode: carrier.carrierCode, carrierName: carrier.carrierName },
    operatorId: operator.userId,
    operatorEmail: operator.email,
    operatorName: operator.name,
  });

  try {
    revalidatePath("/admin/master-data");
    revalidatePath("/master-data");
  } catch {
    // safe fallback
  }

  return {
    success: true,
    message: `Carrier ${carrier.carrierCode} berhasil dihapus.`,
  };
}

// ==============================================================================
// 3. CURRENCY & DAILY FX RATES (VALAS)
// ==============================================================================

export interface AdminCurrencyItem {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBaseCurrency: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface UpsertCurrencyInput {
  id?: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBaseCurrency?: boolean;
  isActive?: boolean;
}

/**
 * Ensures global default currencies exist in DB.
 */
async function ensureDefaultCurrencies() {
  const count = await prisma.masterCurrency.count({ where: { tenantId: null } });
  if (count > 0) return;

  const defaultCurrencies = [
    { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", exchangeRate: 1.0, isBaseCurrency: true },
    { code: "USD", name: "United States Dollar", symbol: "$", exchangeRate: 16250.0, isBaseCurrency: false },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", exchangeRate: 12200.0, isBaseCurrency: false },
    { code: "EUR", name: "Euro", symbol: "€", exchangeRate: 17600.0, isBaseCurrency: false },
    { code: "CNY", name: "Chinese Yuan Renminbi", symbol: "¥", exchangeRate: 2250.0, isBaseCurrency: false },
  ];

  for (const c of defaultCurrencies) {
    const existing = await prisma.masterCurrency.findFirst({
      where: { tenantId: null, code: c.code },
    });
    if (!existing) {
      await prisma.masterCurrency.create({
        data: {
          tenantId: null,
          code: c.code,
          name: c.name,
          symbol: c.symbol,
          exchangeRate: c.exchangeRate,
          isBaseCurrency: c.isBaseCurrency,
          isActive: true,
        },
      });
    }
  }
}

/**
 * Lists global currencies and exchange rates against base IDR.
 */
export async function getGlobalCurrencies(): Promise<AdminCurrencyItem[]> {
  await requireSuperAdmin();
  await ensureDefaultCurrencies();

  const rows = await prisma.masterCurrency.findMany({
    where: { tenantId: null },
    orderBy: [{ isBaseCurrency: "desc" }, { code: "asc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    symbol: r.symbol,
    exchangeRate: Number(r.exchangeRate),
    isBaseCurrency: r.isBaseCurrency,
    isActive: r.isActive,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/**
 * Updates daily exchange rate for a currency against base IDR.
 */
export async function updateGlobalExchangeRate(input: {
  id: string;
  exchangeRate: number;
}): Promise<ActionResult<AdminCurrencyItem>> {
  const operator = await requireSuperAdmin();

  const rate = Number(input.exchangeRate);
  if (isNaN(rate) || rate <= 0) {
    return {
      success: false,
      error: "Nilai kurs konversi harus berupa angka positif lebih dari 0.",
    };
  }

  const existing = await prisma.masterCurrency.findUnique({
    where: { id: input.id },
  });

  if (!existing || existing.tenantId !== null) {
    return { success: false, error: "Mata uang global tidak ditemukan." };
  }

  if (existing.isBaseCurrency && rate !== 1.0) {
    return {
      success: false,
      error: "Mata uang basis fungsional (IDR) harus bernilai kurs tepat 1.0.",
    };
  }

  const oldRate = Number(existing.exchangeRate);
  const updated = await prisma.masterCurrency.update({
    where: { id: input.id },
    data: { exchangeRate: rate },
  });

  await recordAuditLog({
    action: "FX_RATE_UPDATE",
    targetType: "MASTER_CURRENCY",
    targetId: updated.id,
    targetName: `${updated.code} Exchange Rate`,
    details: {
      code: updated.code,
      name: updated.name,
      oldExchangeRate: oldRate,
      newExchangeRate: rate,
    },
    operatorId: operator.userId,
    operatorEmail: operator.email,
    operatorName: operator.name,
  });

  try {
    revalidatePath("/admin/master-data");
    revalidatePath("/master-data");
  } catch {
    // safe fallback
  }

  return {
    success: true,
    message: `Kurs ${updated.code} berhasil diperbarui menjadi Rp ${rate.toLocaleString("id-ID")}.`,
    data: {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      symbol: updated.symbol,
      exchangeRate: Number(updated.exchangeRate),
      isBaseCurrency: updated.isBaseCurrency,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

/**
 * Creates or updates a global currency.
 */
export async function upsertGlobalCurrency(input: UpsertCurrencyInput): Promise<ActionResult<AdminCurrencyItem>> {
  const operator = await requireSuperAdmin();

  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  const symbol = input.symbol.trim();
  let exchangeRate = Number(input.exchangeRate);

  if (!code || !name || !symbol || isNaN(exchangeRate) || exchangeRate <= 0) {
    return {
      success: false,
      error: "Kode valas, nama, simbol, dan nilai kurs valid wajib diisi.",
    };
  }

  if (code !== "IDR" && input.isBaseCurrency === true) {
    return {
      success: false,
      error: "Hanya mata uang Rupiah (IDR) yang dapat menjadi mata uang basis fungsional sistem.",
    };
  }

  const existingWithCode = await prisma.masterCurrency.findFirst({
    where: { tenantId: null, code },
  });

  if (existingWithCode && (!input.id || existingWithCode.id !== input.id)) {
    return {
      success: false,
      error: `Kode mata uang ${code} sudah terdaftar secara global.`,
    };
  }

  let curRecord;
  const isCreate = !input.id;

  if (input.id) {
    const existingById = await prisma.masterCurrency.findUnique({
      where: { id: input.id },
    });
    if (!existingById) {
      return { success: false, error: "Mata uang tidak ditemukan." };
    }

    const isBase = existingById.isBaseCurrency || code === "IDR";
    if (isBase) {
      if (exchangeRate !== 1.0) {
        return {
          success: false,
          error: "Mata uang basis fungsional (IDR) harus bernilai kurs tepat 1.0.",
        };
      }
      exchangeRate = 1.0;
    }

    curRecord = await prisma.masterCurrency.update({
      where: { id: input.id },
      data: {
        code,
        name,
        symbol,
        exchangeRate: isBase ? 1.0 : exchangeRate,
        isBaseCurrency: isBase,
        isActive: input.isActive ?? true,
      },
    });

    await recordAuditLog({
      action: "CURRENCY_UPDATE",
      targetType: "MASTER_CURRENCY",
      targetId: curRecord.id,
      targetName: `${curRecord.code} - ${curRecord.name}`,
      details: { code, name, exchangeRate },
      operatorId: operator.userId,
      operatorEmail: operator.email,
      operatorName: operator.name,
    });
  } else {
    const isBase = code === "IDR" || input.isBaseCurrency === true;
    if (isBase) {
      exchangeRate = 1.0;
    }

    curRecord = await prisma.masterCurrency.create({
      data: {
        tenantId: null,
        code,
        name,
        symbol,
        exchangeRate,
        isBaseCurrency: isBase,
        isActive: input.isActive ?? true,
      },
    });

    await recordAuditLog({
      action: "CURRENCY_CREATE",
      targetType: "MASTER_CURRENCY",
      targetId: curRecord.id,
      targetName: `${curRecord.code} - ${curRecord.name}`,
      details: { code, name, exchangeRate },
      operatorId: operator.userId,
      operatorEmail: operator.email,
      operatorName: operator.name,
    });
  }

  try {
    revalidatePath("/admin/master-data");
    revalidatePath("/master-data");
  } catch {
    // safe fallback
  }

  return {
    success: true,
    message: isCreate
      ? `Mata uang ${code} berhasil ditambahkan.`
      : `Mata uang ${code} berhasil diperbarui.`,
    data: {
      id: curRecord.id,
      code: curRecord.code,
      name: curRecord.name,
      symbol: curRecord.symbol,
      exchangeRate: Number(curRecord.exchangeRate),
      isBaseCurrency: curRecord.isBaseCurrency,
      isActive: curRecord.isActive,
      updatedAt: curRecord.updatedAt.toISOString(),
    },
  };
}

/**
 * Deletes a global currency (blocks base IDR deletion).
 */
export async function deleteGlobalCurrency(id: string): Promise<ActionResult> {
  const operator = await requireSuperAdmin();

  const cur = await prisma.masterCurrency.findUnique({
    where: { id },
  });

  if (!cur || cur.tenantId !== null) {
    return { success: false, error: "Mata uang tidak ditemukan." };
  }

  if (cur.isBaseCurrency || cur.code === "IDR") {
    return {
      success: false,
      error: "Mata uang basis fungsional (IDR) tidak dapat dihapus dari sistem.",
    };
  }

  await prisma.masterCurrency.delete({ where: { id } });

  await recordAuditLog({
    action: "CURRENCY_DELETE",
    targetType: "MASTER_CURRENCY",
    targetId: cur.id,
    targetName: `${cur.code} - ${cur.name}`,
    details: { code: cur.code, name: cur.name },
    operatorId: operator.userId,
    operatorEmail: operator.email,
    operatorName: operator.name,
  });

  try {
    revalidatePath("/admin/master-data");
    revalidatePath("/master-data");
  } catch {
    // safe fallback
  }

  return {
    success: true,
    message: `Mata uang ${cur.code} berhasil dihapus.`,
  };
}
