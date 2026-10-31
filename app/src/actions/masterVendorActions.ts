"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { VendorCategory } from "@prisma/client";

export interface VendorFormData {
  vendorCode?: string;
  name: string;
  category: VendorCategory;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  provinceId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  postalCode?: string;
  taxId?: string;
  creditLimit?: number;
  paymentTermDays?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  isActive?: boolean;
}

export interface VendorActionResult {
  success: boolean;
  message?: string;
  error?: string;
  vendorId?: string;
}

/**
 * Resolve tenant helper
 */
async function resolveTenant(subdomainOrId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ subdomain: subdomainOrId }, { id: subdomainOrId }],
    },
    select: { id: true, subdomain: true, companyName: true },
  });

  if (!tenant) {
    throw new Error(`Tenant '${subdomainOrId}' tidak ditemukan dalam database.`);
  }

  return tenant;
}

/**
 * Get vendors for a tenant with pagination, category filter and search
 */
export async function getTenantVendors(
  tenantSubdomain: string,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }
) {
  const tenant = await resolveTenant(tenantSubdomain);
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, Math.min(50, options?.limit || 6));
  const skip = (page - 1) * limit;
  const search = options?.search?.trim() || "";
  const categoryFilter = options?.category && options.category !== "ALL" ? (options.category as VendorCategory) : undefined;

  const whereCondition: any = {
    tenantId: tenant.id,
  };

  if (categoryFilter) {
    whereCondition.category = categoryFilter;
  }

  if (search) {
    whereCondition.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { vendorCode: { contains: search, mode: "insensitive" } },
      { taxId: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [totalCount, vendors, countsByCategory] = await Promise.all([
    prisma.masterVendor.count({ where: whereCondition }),
    prisma.masterVendor.findMany({
      where: whereCondition,
      include: {
        province: { select: { id: true, name: true } },
        cityRef: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.masterVendor.groupBy({
      by: ["category"],
      where: { tenantId: tenant.id },
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const categoryStats = {
    sea: countsByCategory.find((c) => c.category === "CARRIER_SEA")?._count.id || 0,
    air: countsByCategory.find((c) => c.category === "CARRIER_AIR")?._count.id || 0,
    truck: countsByCategory.find((c) => c.category === "HAULAGE_TRUCK")?._count.id || 0,
    broker: countsByCategory.find((c) => c.category === "CUSTOMS_BROKER")?._count.id || 0,
    others: countsByCategory.find((c) => c.category === "OTHERS")?._count.id || 0,
  };

  return {
    tenant,
    vendors: vendors.map((v) => ({
      id: v.id,
      vendorCode: v.vendorCode,
      name: v.name,
      category: v.category,
      contactPerson: v.contactPerson || "-",
      email: v.email || "-",
      phone: v.phone || "-",
      address: v.address || "-",
      provinceId: v.provinceId,
      provinceName: v.province?.name || null,
      cityId: v.cityId,
      cityName: v.cityRef?.name || v.city || null,
      districtId: v.districtId,
      districtName: v.district?.name || null,
      postalCode: v.postalCode || "-",
      taxId: v.taxId || "-",
      paymentTermDays: v.paymentTermDays,
      creditLimit: Number(v.creditLimit) || 0,
      bankName: v.bankName || "-",
      bankAccountNumber: v.bankAccountNumber || "-",
      bankAccountHolder: v.bankAccountHolder || "-",
      isActive: v.isActive,
      createdAt: v.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    categoryStats,
  };
}

/**
 * Create a new Vendor record for Tenant
 */
export async function createTenantVendor(
  tenantSubdomain: string,
  data: VendorFormData
): Promise<VendorActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    if (!data.name || data.name.trim() === "") {
      return { success: false, error: "Nama Perusahaan Vendor wajib diisi." };
    }

    // Auto generate code if not provided
    let vendorCode = data.vendorCode?.trim();
    if (!vendorCode) {
      const existingCount = await prisma.masterVendor.count({
        where: { tenantId: tenant.id },
      });
      vendorCode = `VND-${String(existingCount + 1).padStart(3, "0")}`;
    }

    // Ensure code uniqueness per tenant
    const existingCode = await prisma.masterVendor.findFirst({
      where: {
        tenantId: tenant.id,
        vendorCode,
      },
    });

    if (existingCode) {
      vendorCode = `${vendorCode}-${Date.now().toString().slice(-4)}`;
    }

    const newVendor = await prisma.masterVendor.create({
      data: {
        tenantId: tenant.id,
        vendorCode,
        name: data.name.trim(),
        category: data.category || VendorCategory.CARRIER_SEA,
        contactPerson: data.contactPerson?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        provinceId: data.provinceId && data.provinceId !== "" ? data.provinceId : null,
        cityId: data.cityId && data.cityId !== "" ? data.cityId : null,
        districtId: data.districtId && data.districtId !== "" ? data.districtId : null,
        postalCode: data.postalCode?.trim() || null,
        taxId: data.taxId?.trim() || null,
        paymentTermDays: data.paymentTermDays ? Number(data.paymentTermDays) : 30,
        creditLimit: data.creditLimit ? Number(data.creditLimit) : 0,
        bankName: data.bankName?.trim() || null,
        bankAccountNumber: data.bankAccountNumber?.trim() || null,
        bankAccountHolder: data.bankAccountHolder?.trim() || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath(`/${tenant.subdomain}`);
    revalidatePath(`/${tenant.subdomain}/vendors`);
    revalidatePath(`/${tenant.subdomain}/master`);
    revalidatePath(`/${tenant.subdomain}/jobs/new`);

    return {
      success: true,
      message: `Vendor "${newVendor.name}" (${newVendor.vendorCode}) berhasil didaftarkan.`,
      vendorId: newVendor.id,
    };
  } catch (error) {
    console.error("[createTenantVendor] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan data vendor ke database.",
    };
  }
}

/**
 * Update an existing Vendor record
 */
export async function updateTenantVendor(
  tenantSubdomain: string,
  vendorId: string,
  data: Partial<VendorFormData>
): Promise<VendorActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    const vendor = await prisma.masterVendor.findFirst({
      where: { id: vendorId, tenantId: tenant.id },
    });

    if (!vendor) {
      return { success: false, error: "Data vendor tidak ditemukan." };
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.vendorCode !== undefined) updateData.vendorCode = data.vendorCode.trim();
    if (data.category !== undefined) updateData.category = data.category;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson?.trim() || null;
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.provinceId !== undefined) updateData.provinceId = data.provinceId || null;
    if (data.cityId !== undefined) updateData.cityId = data.cityId || null;
    if (data.districtId !== undefined) updateData.districtId = data.districtId || null;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode?.trim() || null;
    if (data.taxId !== undefined) updateData.taxId = data.taxId?.trim() || null;
    if (data.paymentTermDays !== undefined) updateData.paymentTermDays = Number(data.paymentTermDays);
    if (data.creditLimit !== undefined) updateData.creditLimit = Number(data.creditLimit);
    if (data.bankName !== undefined) updateData.bankName = data.bankName?.trim() || null;
    if (data.bankAccountNumber !== undefined) updateData.bankAccountNumber = data.bankAccountNumber?.trim() || null;
    if (data.bankAccountHolder !== undefined) updateData.bankAccountHolder = data.bankAccountHolder?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.masterVendor.update({
      where: { id: vendorId },
      data: updateData,
    });

    revalidatePath(`/${tenant.subdomain}`);
    revalidatePath(`/${tenant.subdomain}/vendors`);
    revalidatePath(`/${tenant.subdomain}/master`);
    revalidatePath(`/${tenant.subdomain}/jobs/new`);

    return {
      success: true,
      message: `Data vendor "${updateData.name || vendor.name}" berhasil diperbarui.`,
    };
  } catch (error) {
    console.error("[updateTenantVendor] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui data vendor.",
    };
  }
}

/**
 * Delete a Vendor record (with integrity check against existing JobFiles)
 */
export async function deleteTenantVendor(
  tenantSubdomain: string,
  vendorId: string
): Promise<VendorActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    const vendor = await prisma.masterVendor.findFirst({
      where: { id: vendorId, tenantId: tenant.id },
      include: {
        _count: {
          select: { jobFiles: true },
        },
      },
    });

    if (!vendor) {
      return { success: false, error: "Data vendor tidak ditemukan." };
    }

    if (vendor._count.jobFiles > 0) {
      return {
        success: false,
        error: `Vendor "${vendor.name}" tidak dapat dihapus karena telah terikat dengan ${vendor._count.jobFiles} transaksi Job File. Silakan ubah status menjadi Nonaktif sebagai gantinya.`,
      };
    }

    await prisma.masterVendor.delete({
      where: { id: vendorId },
    });

    revalidatePath(`/${tenant.subdomain}`);
    revalidatePath(`/${tenant.subdomain}/vendors`);
    revalidatePath(`/${tenant.subdomain}/master`);
    revalidatePath(`/${tenant.subdomain}/jobs/new`);

    return {
      success: true,
      message: `Vendor "${vendor.name}" berhasil dihapus dari database.`,
    };
  } catch (error) {
    console.error("[deleteTenantVendor] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus data vendor.",
    };
  }
}
