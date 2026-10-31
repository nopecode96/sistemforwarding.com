"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PortType, UnitCategory, PrefixType } from "@prisma/client";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

export interface MasterActionResult {
  success: boolean;
  message?: string;
  error?: string;
  id?: string;
}

async function resolveTenant(subdomainOrId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ subdomain: subdomainOrId }, { id: subdomainOrId }],
    },
    select: { id: true, subdomain: true, companyName: true },
  });

  if (!tenant) {
    throw new Error(`Tenant '${subdomainOrId}' tidak ditemukan.`);
  }

  return tenant;
}

// ==============================================================================
// 1. MASTER PORT (UN/LOCODE) CRUD
// ==============================================================================

export async function createMasterPort(data: {
  portCode: string;
  portName: string;
  portType?: PortType;
  city: string;
  countryCode?: string;
  countryName?: string;
  isMajor?: boolean;
}): Promise<MasterActionResult> {
  try {
    const portCode = data.portCode.trim().toUpperCase();
    if (!portCode || !data.portName.trim()) {
      return { success: false, error: "Kode UN/LOCODE dan nama pelabuhan wajib diisi." };
    }

    const existing = await prisma.masterPort.findUnique({
      where: { portCode },
    });
    if (existing) {
      return { success: false, error: `Pelabuhan dengan kode UN/LOCODE '${portCode}' sudah terdaftar.` };
    }

    const newPort = await prisma.masterPort.create({
      data: {
        portCode,
        portName: data.portName.trim(),
        portType: data.portType || PortType.SEA_PORT,
        city: data.city.trim() || "-",
        countryCode: data.countryCode?.trim().toUpperCase() || "ID",
        countryName: data.countryName?.trim() || "Indonesia",
        isMajor: data.isMajor !== undefined ? data.isMajor : true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return {
      success: true,
      message: `Pelabuhan [${newPort.portCode}] ${newPort.portName} berhasil didaftarkan.`,
      id: newPort.id,
    };
  } catch (error) {
    console.error("[createMasterPort] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan pelabuhan." };
  }
}

export async function updateMasterPort(
  id: string,
  data: {
    portCode?: string;
    portName?: string;
    portType?: PortType;
    city?: string;
    countryCode?: string;
    countryName?: string;
    isMajor?: boolean;
    isActive?: boolean;
  }
): Promise<MasterActionResult> {
  try {
    const port = await prisma.masterPort.findUnique({ where: { id } });
    if (!port) return { success: false, error: "Data pelabuhan tidak ditemukan." };

    const updateData: any = {};
    if (data.portCode) updateData.portCode = data.portCode.trim().toUpperCase();
    if (data.portName) updateData.portName = data.portName.trim();
    if (data.portType) updateData.portType = data.portType;
    if (data.city) updateData.city = data.city.trim();
    if (data.countryCode) updateData.countryCode = data.countryCode.trim().toUpperCase();
    if (data.countryName) updateData.countryName = data.countryName.trim();
    if (data.isMajor !== undefined) updateData.isMajor = data.isMajor;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.masterPort.update({
      where: { id },
      data: updateData,
    });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: "Data pelabuhan berhasil diperbarui." };
  } catch (error) {
    console.error("[updateMasterPort] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui pelabuhan." };
  }
}

export async function deleteMasterPort(id: string): Promise<MasterActionResult> {
  try {
    const port = await prisma.masterPort.findUnique({
      where: { id },
      include: {
        _count: {
          select: { originJobFiles: true, destinationJobFiles: true },
        },
      },
    });

    if (!port) return { success: false, error: "Pelabuhan tidak ditemukan." };

    const totalUsage = port._count.originJobFiles + port._count.destinationJobFiles;
    if (totalUsage > 0) {
      return {
        success: false,
        error: `Pelabuhan [${port.portCode}] tidak dapat dihapus karena telah digunakan pada ${totalUsage} data Job File operasional.`,
      };
    }

    await prisma.masterPort.delete({ where: { id } });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: `Pelabuhan [${port.portCode}] ${port.portName} berhasil dihapus.` };
  } catch (error) {
    console.error("[deleteMasterPort] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus pelabuhan." };
  }
}

// ==============================================================================
// 2. MASTER UNIT (UoM & DIMENSI ARMADA) CRUD
// ==============================================================================

export async function createMasterUnit(data: {
  unitCode: string;
  unitName: string;
  unitCategory: UnitCategory;
  symbol?: string;
  maxWeightKg?: number;
  maxVolumeCbm?: number;
  tareWeightKg?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  description?: string;
}): Promise<MasterActionResult> {
  try {
    const unitCode = data.unitCode.trim().toUpperCase();
    if (!unitCode || !data.unitName.trim()) {
      return { success: false, error: "Kode satuan dan nama satuan wajib diisi." };
    }

    const existing = await prisma.masterUnit.findUnique({ where: { unitCode } });
    if (existing) {
      return { success: false, error: `Satuan dengan kode '${unitCode}' sudah terdaftar.` };
    }

    const newUnit = await prisma.masterUnit.create({
      data: {
        unitCode,
        unitName: data.unitName.trim(),
        unitCategory: data.unitCategory || UnitCategory.PACKAGE,
        symbol: data.symbol?.trim() || null,
        maxWeightKg: data.maxWeightKg ? Number(data.maxWeightKg) : null,
        maxVolumeCbm: data.maxVolumeCbm ? Number(data.maxVolumeCbm) : null,
        tareWeightKg: data.tareWeightKg ? Number(data.tareWeightKg) : null,
        lengthM: data.lengthM ? Number(data.lengthM) : null,
        widthM: data.widthM ? Number(data.widthM) : null,
        heightM: data.heightM ? Number(data.heightM) : null,
        description: data.description?.trim() || null,
        isActive: true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return {
      success: true,
      message: `Satuan/Armada [${newUnit.unitCode}] ${newUnit.unitName} berhasil didaftarkan.`,
      id: newUnit.id,
    };
  } catch (error) {
    console.error("[createMasterUnit] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan satuan." };
  }
}

export async function updateMasterUnit(
  id: string,
  data: {
    unitCode?: string;
    unitName?: string;
    unitCategory?: UnitCategory;
    symbol?: string;
    maxWeightKg?: number;
    maxVolumeCbm?: number;
    tareWeightKg?: number;
    lengthM?: number;
    widthM?: number;
    heightM?: number;
    description?: string;
    isActive?: boolean;
  }
): Promise<MasterActionResult> {
  try {
    const unit = await prisma.masterUnit.findUnique({ where: { id } });
    if (!unit) return { success: false, error: "Satuan tidak ditemukan." };

    const updateData: any = {};
    if (data.unitCode) updateData.unitCode = data.unitCode.trim().toUpperCase();
    if (data.unitName) updateData.unitName = data.unitName.trim();
    if (data.unitCategory) updateData.unitCategory = data.unitCategory;
    if (data.symbol !== undefined) updateData.symbol = data.symbol?.trim() || null;
    if (data.maxWeightKg !== undefined) updateData.maxWeightKg = data.maxWeightKg ? Number(data.maxWeightKg) : null;
    if (data.maxVolumeCbm !== undefined) updateData.maxVolumeCbm = data.maxVolumeCbm ? Number(data.maxVolumeCbm) : null;
    if (data.tareWeightKg !== undefined) updateData.tareWeightKg = data.tareWeightKg ? Number(data.tareWeightKg) : null;
    if (data.lengthM !== undefined) updateData.lengthM = data.lengthM ? Number(data.lengthM) : null;
    if (data.widthM !== undefined) updateData.widthM = data.widthM ? Number(data.widthM) : null;
    if (data.heightM !== undefined) updateData.heightM = data.heightM ? Number(data.heightM) : null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.masterUnit.update({ where: { id }, data: updateData });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: "Data satuan berhasil diperbarui." };
  } catch (error) {
    console.error("[updateMasterUnit] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui satuan." };
  }
}

export async function deleteMasterUnit(id: string): Promise<MasterActionResult> {
  try {
    const unit = await prisma.masterUnit.findUnique({
      where: { id },
      include: {
        _count: {
          select: { packageJobFiles: true, containerJobFiles: true, chargeCodes: true },
        },
      },
    });

    if (!unit) return { success: false, error: "Satuan tidak ditemukan." };

    const totalUsage = unit._count.packageJobFiles + unit._count.containerJobFiles + unit._count.chargeCodes;
    if (totalUsage > 0) {
      return {
        success: false,
        error: `Satuan [${unit.unitCode}] tidak dapat dihapus karena telah terhubung ke ${totalUsage} data Job File / Komponen Biaya.`,
      };
    }

    await prisma.masterUnit.delete({ where: { id } });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: `Satuan [${unit.unitCode}] ${unit.unitName} berhasil dihapus.` };
  } catch (error) {
    console.error("[deleteMasterUnit] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus satuan." };
  }
}

// ==============================================================================
// 3. MASTER ITEM TYPE (KLASIFIKASI KOMODITAS) CRUD
// ==============================================================================

export async function createMasterItemType(data: {
  itemCode: string;
  name: string;
  isDangerousGoods?: boolean;
  unNumber?: string;
  classDg?: string;
  requiresColdChain?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  description?: string;
}): Promise<MasterActionResult> {
  try {
    const itemCode = data.itemCode.trim().toUpperCase();
    if (!itemCode || !data.name.trim()) {
      return { success: false, error: "Kode komoditas dan nama komoditas wajib diisi." };
    }

    const existing = await prisma.masterItemType.findUnique({ where: { itemCode } });
    if (existing) {
      return { success: false, error: `Komoditas dengan kode '${itemCode}' sudah terdaftar.` };
    }

    const newType = await prisma.masterItemType.create({
      data: {
        itemCode,
        name: data.name.trim(),
        isDangerousGoods: data.isDangerousGoods || false,
        unNumber: data.unNumber?.trim() || null,
        classDg: data.classDg?.trim() || null,
        requiresColdChain: data.requiresColdChain || false,
        minTemperature: data.minTemperature !== undefined ? Number(data.minTemperature) : null,
        maxTemperature: data.maxTemperature !== undefined ? Number(data.maxTemperature) : null,
        description: data.description?.trim() || null,
        isActive: true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return {
      success: true,
      message: `Komoditas [${newType.itemCode}] ${newType.name} berhasil didaftarkan.`,
      id: newType.id,
    };
  } catch (error) {
    console.error("[createMasterItemType] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan komoditas." };
  }
}

export async function updateMasterItemType(
  id: string,
  data: {
    itemCode?: string;
    name?: string;
    isDangerousGoods?: boolean;
    unNumber?: string;
    classDg?: string;
    requiresColdChain?: boolean;
    minTemperature?: number;
    maxTemperature?: number;
    description?: string;
    isActive?: boolean;
  }
): Promise<MasterActionResult> {
  try {
    const item = await prisma.masterItemType.findUnique({ where: { id } });
    if (!item) return { success: false, error: "Komoditas tidak ditemukan." };

    const updateData: any = {};
    if (data.itemCode) updateData.itemCode = data.itemCode.trim().toUpperCase();
    if (data.name) updateData.name = data.name.trim();
    if (data.isDangerousGoods !== undefined) updateData.isDangerousGoods = data.isDangerousGoods;
    if (data.unNumber !== undefined) updateData.unNumber = data.unNumber?.trim() || null;
    if (data.classDg !== undefined) updateData.classDg = data.classDg?.trim() || null;
    if (data.requiresColdChain !== undefined) updateData.requiresColdChain = data.requiresColdChain;
    if (data.minTemperature !== undefined) updateData.minTemperature = data.minTemperature ? Number(data.minTemperature) : null;
    if (data.maxTemperature !== undefined) updateData.maxTemperature = data.maxTemperature ? Number(data.maxTemperature) : null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.masterItemType.update({ where: { id }, data: updateData });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: "Data komoditas berhasil diperbarui." };
  } catch (error) {
    console.error("[updateMasterItemType] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui komoditas." };
  }
}

export async function deleteMasterItemType(id: string): Promise<MasterActionResult> {
  try {
    const item = await prisma.masterItemType.findUnique({
      where: { id },
      include: { _count: { select: { jobFiles: true } } },
    });

    if (!item) return { success: false, error: "Komoditas tidak ditemukan." };

    if (item._count.jobFiles > 0) {
      return {
        success: false,
        error: `Komoditas [${item.itemCode}] tidak dapat dihapus karena telah digunakan pada ${item._count.jobFiles} Job File.`,
      };
    }

    await prisma.masterItemType.delete({ where: { id } });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: `Komoditas [${item.itemCode}] berhasil dihapus.` };
  } catch (error) {
    console.error("[deleteMasterItemType] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus komoditas." };
  }
}

// ==============================================================================
// 4. MASTER WILAYAH GEOGRAFIS INDONESIA (PROVINSI, KOTA/KAB, KECAMATAN) CRUD
// ==============================================================================

export async function createMasterProvince(data: {
  name: string;
  code?: string;
}): Promise<MasterActionResult> {
  try {
    const name = data.name.trim();
    if (!name) return { success: false, error: "Nama provinsi wajib diisi." };

    const existing = await prisma.masterProvince.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      return { success: false, error: `Provinsi "${name}" sudah terdaftar.` };
    }

    const newProv = await prisma.masterProvince.create({
      data: {
        name,
        code: data.code?.trim() || null,
        isActive: true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/customers");
    safeRevalidate("/vendors");

    return { success: true, message: `Provinsi "${newProv.name}" berhasil ditambahkan.`, id: newProv.id };
  } catch (error) {
    console.error("[createMasterProvince] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan provinsi." };
  }
}

export async function updateMasterProvince(
  id: string,
  data: { name: string; code?: string; isActive?: boolean }
): Promise<MasterActionResult> {
  try {
    await prisma.masterProvince.update({
      where: { id },
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/customers");
    safeRevalidate("/vendors");

    return { success: true, message: "Provinsi berhasil diperbarui." };
  } catch (error) {
    console.error("[updateMasterProvince] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui provinsi." };
  }
}

export async function deleteMasterProvince(id: string): Promise<MasterActionResult> {
  try {
    const prov = await prisma.masterProvince.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cities: true, customers: true, vendors: true },
        },
      },
    });

    if (!prov) return { success: false, error: "Provinsi tidak ditemukan." };

    if (prov._count.cities > 0 || prov._count.customers > 0 || prov._count.vendors > 0) {
      return {
        success: false,
        error: `Provinsi "${prov.name}" tidak dapat dihapus karena masih memiliki ${prov._count.cities} Kota/Kabupaten dan terhubung ke data Customer/Vendor. Hapus kota di dalamnya terlebih dahulu.`,
      };
    }

    await prisma.masterProvince.delete({ where: { id } });

    safeRevalidate("/master");
    safeRevalidate("/customers");
    safeRevalidate("/vendors");

    return { success: true, message: `Provinsi "${prov.name}" berhasil dihapus.` };
  } catch (error) {
    console.error("[deleteMasterProvince] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus provinsi." };
  }
}

export async function createMasterCity(data: {
  provinceId: string;
  name: string;
  type?: string;
  code?: string;
}): Promise<MasterActionResult> {
  try {
    const name = data.name.trim();
    if (!data.provinceId || !name) {
      return { success: false, error: "Provinsi dan nama kota/kabupaten wajib dipilih/diisi." };
    }

    const existing = await prisma.masterCity.findFirst({
      where: {
        provinceId: data.provinceId,
        name: { equals: name, mode: "insensitive" },
      },
    });
    if (existing) {
      return { success: false, error: `Kota/Kabupaten "${name}" sudah terdaftar di provinsi ini.` };
    }

    const newCity = await prisma.masterCity.create({
      data: {
        provinceId: data.provinceId,
        name,
        type: data.type || "KOTA",
        code: data.code?.trim() || null,
        isActive: true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/customers");
    safeRevalidate("/vendors");

    return { success: true, message: `Kota "${newCity.name}" berhasil ditambahkan.`, id: newCity.id };
  } catch (error) {
    console.error("[createMasterCity] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan kota." };
  }
}

export async function updateMasterCity(
  id: string,
  data: {
    provinceId?: string;
    name: string;
    type?: string;
    code?: string;
    isActive?: boolean;
  }
): Promise<MasterActionResult> {
  try {
    await prisma.masterCity.update({
      where: { id },
      data: {
        provinceId: data.provinceId,
        name: data.name.trim(),
        type: data.type || "KOTA",
        code: data.code?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/customers");
    safeRevalidate("/vendors");

    return { success: true, message: "Data Kota/Kabupaten berhasil diperbarui." };
  } catch (error) {
    console.error("[updateMasterCity] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui kota." };
  }
}

export async function deleteMasterCity(id: string): Promise<MasterActionResult> {
  try {
    const city = await prisma.masterCity.findUnique({
      where: { id },
      include: {
        _count: {
          select: { districts: true, customers: true, vendors: true },
        },
      },
    });

    if (!city) return { success: false, error: "Kota tidak ditemukan." };

    if (city._count.districts > 0 || city._count.customers > 0 || city._count.vendors > 0) {
      return {
        success: false,
        error: `Kota "${city.name}" tidak dapat dihapus karena memiliki ${city._count.districts} Kecamatan atau terhubung ke Customer/Vendor.`,
      };
    }

    await prisma.masterCity.delete({ where: { id } });

    safeRevalidate("/master");
    safeRevalidate("/customers");
    safeRevalidate("/vendors");

    return { success: true, message: `Kota "${city.name}" berhasil dihapus.` };
  } catch (error) {
    console.error("[deleteMasterCity] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus kota." };
  }
}

export async function createMasterDistrict(data: {
  cityId: string;
  name: string;
  code?: string;
}): Promise<MasterActionResult> {
  try {
    const name = data.name.trim();
    if (!data.cityId || !name) {
      return { success: false, error: "Kota/Kabupaten dan nama kecamatan wajib dipilih/diisi." };
    }

    const existing = await prisma.masterDistrict.findFirst({
      where: {
        cityId: data.cityId,
        name: { equals: name, mode: "insensitive" },
      },
    });
    if (existing) {
      return { success: false, error: `Kecamatan "${name}" sudah terdaftar di kota ini.` };
    }

    const newDist = await prisma.masterDistrict.create({
      data: {
        cityId: data.cityId,
        name,
        code: data.code?.trim() || null,
        isActive: true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/customers");
    safeRevalidate("/vendors");

    return { success: true, message: `Kecamatan "${newDist.name}" berhasil ditambahkan.`, id: newDist.id };
  } catch (error) {
    console.error("[createMasterDistrict] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan kecamatan." };
  }
}

export async function updateMasterDistrict(
  id: string,
  data: {
    cityId?: string;
    name: string;
    code?: string;
    isActive?: boolean;
  }
): Promise<MasterActionResult> {
  try {
    await prisma.masterDistrict.update({
      where: { id },
      data: {
        cityId: data.cityId,
        name: data.name.trim(),
        code: data.code?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/customers");
    safeRevalidate("/vendors");

    return { success: true, message: "Kecamatan berhasil diperbarui." };
  } catch (error) {
    console.error("[updateMasterDistrict] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui kecamatan." };
  }
}

export async function deleteMasterDistrict(id: string): Promise<MasterActionResult> {
  try {
    const dist = await prisma.masterDistrict.findUnique({
      where: { id },
      include: {
        _count: {
          select: { customers: true, vendors: true },
        },
      },
    });

    if (!dist) return { success: false, error: "Kecamatan tidak ditemukan." };

    if (dist._count.customers > 0 || dist._count.vendors > 0) {
      return {
        success: false,
        error: `Kecamatan "${dist.name}" tidak dapat dihapus karena sedang terhubung ke alamat Customer/Vendor.`,
      };
    }

    await prisma.masterDistrict.delete({ where: { id } });

    safeRevalidate("/master");
    safeRevalidate("/customers");
    safeRevalidate("/vendors");

    return { success: true, message: `Kecamatan "${dist.name}" berhasil dihapus.` };
  } catch (error) {
    console.error("[deleteMasterDistrict] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus kecamatan." };
  }
}

// ==============================================================================
// 5. MASTER PREFIX (FORMAT PENOMORAN) CRUD
// ==============================================================================

export async function createMasterPrefix(
  tenantSubdomain: string,
  data: {
    prefixType: PrefixType;
    prefixCode: string;
    formatPattern: string;
    zeroPadding?: number;
    currentSequence?: number;
    resetCycle?: string;
  }
): Promise<MasterActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);
    const prefixCode = data.prefixCode.trim().toUpperCase();

    const existing = await prisma.masterPrefix.findUnique({
      where: {
        tenantId_prefixType: {
          tenantId: tenant.id,
          prefixType: data.prefixType,
        },
      },
    });

    if (existing) {
      return { success: false, error: `Format penomoran untuk tipe ${data.prefixType} sudah terkonfigurasi pada ruang kerja Anda.` };
    }

    const newPrefix = await prisma.masterPrefix.create({
      data: {
        tenantId: tenant.id,
        prefixType: data.prefixType,
        prefixCode,
        formatPattern: data.formatPattern.trim(),
        zeroPadding: Number(data.zeroPadding) || 5,
        currentSequence: Number(data.currentSequence) || 0,
        resetCycle: data.resetCycle || "YEARLY",
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return {
      success: true,
      message: `Pola penomoran ${newPrefix.prefixType} (${newPrefix.formatPattern}) berhasil dikonfigurasi.`,
      id: newPrefix.id,
    };
  } catch (error) {
    console.error("[createMasterPrefix] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan format penomoran." };
  }
}

export async function updateMasterPrefix(
  tenantSubdomain: string,
  id: string,
  data: {
    prefixCode?: string;
    formatPattern?: string;
    zeroPadding?: number;
    currentSequence?: number;
    resetCycle?: string;
  }
): Promise<MasterActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);
    const prefix = await prisma.masterPrefix.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!prefix) return { success: false, error: "Pola penomoran tidak ditemukan." };

    const updateData: any = {};
    if (data.prefixCode) updateData.prefixCode = data.prefixCode.trim().toUpperCase();
    if (data.formatPattern) updateData.formatPattern = data.formatPattern.trim();
    if (data.zeroPadding !== undefined) updateData.zeroPadding = Number(data.zeroPadding);
    if (data.currentSequence !== undefined) updateData.currentSequence = Number(data.currentSequence);
    if (data.resetCycle) updateData.resetCycle = data.resetCycle;

    await prisma.masterPrefix.update({
      where: { id },
      data: updateData,
    });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: `Format penomoran ${prefix.prefixType} berhasil diperbarui.` };
  } catch (error) {
    console.error("[updateMasterPrefix] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui penomoran." };
  }
}

export async function deleteMasterPrefix(
  tenantSubdomain: string,
  id: string
): Promise<MasterActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);
    const prefix = await prisma.masterPrefix.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!prefix) return { success: false, error: "Format penomoran tidak ditemukan." };

    await prisma.masterPrefix.delete({ where: { id } });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: `Pola penomoran ${prefix.prefixType} berhasil dihapus.` };
  } catch (error) {
    console.error("[deleteMasterPrefix] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus penomoran." };
  }
}

// ==============================================================================
// 6. MASTER CURRENCY (MATA UANG & KURS) CRUD
// ==============================================================================

export async function createMasterCurrency(
  tenantSubdomain: string,
  data: {
    code: string;
    name: string;
    symbol: string;
    exchangeRate?: number;
    isBaseCurrency?: boolean;
  }
): Promise<MasterActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);
    const code = data.code.trim().toUpperCase();

    if (!code || !data.name.trim() || !data.symbol.trim()) {
      return { success: false, error: "Kode mata uang, nama mata uang, dan simbol wajib diisi." };
    }

    const existing = await prisma.masterCurrency.findFirst({
      where: {
        OR: [{ tenantId: tenant.id, code }, { tenantId: null, code }],
      },
    });

    if (existing) {
      return { success: false, error: `Mata uang dengan kode '${code}' sudah terdaftar.` };
    }

    const newCur = await prisma.masterCurrency.create({
      data: {
        tenantId: tenant.id,
        code,
        name: data.name.trim(),
        symbol: data.symbol.trim(),
        exchangeRate: Number(data.exchangeRate) || 1.0,
        isBaseCurrency: data.isBaseCurrency || false,
        isActive: true,
      },
    });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return {
      success: true,
      message: `Mata uang ${newCur.code} (${newCur.name}) berhasil didaftarkan.`,
      id: newCur.id,
    };
  } catch (error) {
    console.error("[createMasterCurrency] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan mata uang." };
  }
}

export async function updateMasterCurrency(
  tenantSubdomain: string,
  id: string,
  data: {
    name?: string;
    symbol?: string;
    exchangeRate?: number;
    isBaseCurrency?: boolean;
    isActive?: boolean;
  }
): Promise<MasterActionResult> {
  try {
    const cur = await prisma.masterCurrency.findUnique({ where: { id } });
    if (!cur) return { success: false, error: "Mata uang tidak ditemukan." };

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.symbol) updateData.symbol = data.symbol.trim();
    if (data.exchangeRate !== undefined) updateData.exchangeRate = Number(data.exchangeRate);
    if (data.isBaseCurrency !== undefined) updateData.isBaseCurrency = data.isBaseCurrency;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.masterCurrency.update({
      where: { id },
      data: updateData,
    });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: `Data kurs ${cur.code} berhasil diperbarui.` };
  } catch (error) {
    console.error("[updateMasterCurrency] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal memperbarui mata uang." };
  }
}

export async function deleteMasterCurrency(
  tenantSubdomain: string,
  id: string
): Promise<MasterActionResult> {
  try {
    const cur = await prisma.masterCurrency.findUnique({
      where: { id },
      include: {
        _count: { select: { jobFiles: true, invoices: true, chargeCodes: true } },
      },
    });

    if (!cur) return { success: false, error: "Mata uang tidak ditemukan." };

    if (cur.isBaseCurrency) {
      return { success: false, error: "Mata uang dasar (Base Currency) tidak dapat dihapus." };
    }

    const totalUsage = cur._count.jobFiles + cur._count.invoices + cur._count.chargeCodes;
    if (totalUsage > 0) {
      return {
        success: false,
        error: `Mata uang ${cur.code} tidak dapat dihapus karena telah digunakan pada ${totalUsage} data transaksi.`,
      };
    }

    await prisma.masterCurrency.delete({ where: { id } });

    safeRevalidate("/master");
    safeRevalidate("/jobs/new");

    return { success: true, message: `Mata uang ${cur.code} berhasil dihapus.` };
  } catch (error) {
    console.error("[deleteMasterCurrency] Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus mata uang." };
  }
}
