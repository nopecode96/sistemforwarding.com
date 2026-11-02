"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CustomerType } from "@prisma/client";

export interface CustomerFormData {
  customerCode?: string;
  name: string;
  customerType?: CustomerType;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  provinceId?: string;
  cityId?: string;
  districtId?: string;
  postalCode?: string;
  taxId?: string;
  paymentTermDays?: number;
  creditLimit?: number;
  isActive?: boolean;
}

export interface CustomerActionResult {
  success: boolean;
  message?: string;
  error?: string;
  customerId?: string;
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
 * Get customers for a tenant with pagination and optional search
 */
export async function getTenantCustomers(
  tenantSubdomain: string,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
  }
) {
  const tenant = await resolveTenant(tenantSubdomain);
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, Math.min(50, options?.limit || 6));
  const skip = (page - 1) * limit;
  const search = options?.search?.trim() || "";

  const whereCondition: any = {
    tenantId: tenant.id,
  };

  if (search) {
    whereCondition.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { customerCode: { contains: search, mode: "insensitive" } },
      { taxId: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [totalCount, customers] = await Promise.all([
    prisma.masterCustomer.count({ where: whereCondition }),
    prisma.masterCustomer.findMany({
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
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    tenant,
    customers: customers.map((c) => ({
      id: c.id,
      customerCode: c.customerCode,
      name: c.name,
      customerType: c.customerType,
      contactPerson: c.contactPerson || "-",
      email: c.email || "-",
      phone: c.phone || "-",
      address: c.address || "-",
      provinceId: c.provinceId,
      provinceName: c.province?.name || null,
      cityId: c.cityId,
      cityName: c.cityRef?.name || c.city || null,
      districtId: c.districtId,
      districtName: c.district?.name || null,
      postalCode: c.postalCode || "-",
      taxId: c.taxId || "-",
      paymentTermDays: c.paymentTermDays,
      creditLimit: Number(c.creditLimit) || 0,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Fetch Indonesian geographical reference data (Provinces -> Cities -> Districts)
 */
export async function getGeographicalReferences() {
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

  return provinces.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    cities: p.cities.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      districts: c.districts.map((d) => ({
        id: d.id,
        name: d.name,
      })),
    })),
  }));
}

/**
 * Create a new Customer record for Tenant
 */
export async function createTenantCustomer(
  tenantSubdomain: string,
  data: CustomerFormData
): Promise<CustomerActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    if (!data.name || data.name.trim() === "") {
      return { success: false, error: "Nama Perusahaan Pelanggan wajib diisi." };
    }

    // Auto generate code if not provided
    let customerCode = data.customerCode?.trim();
    if (!customerCode) {
      const existingCount = await prisma.masterCustomer.count({
        where: { tenantId: tenant.id },
      });
      customerCode = `CUST-${String(existingCount + 1).padStart(3, "0")}`;
    }

    // Check code uniqueness per tenant
    const existingCode = await prisma.masterCustomer.findUnique({
      where: {
        tenantId_customerCode: {
          tenantId: tenant.id,
          customerCode,
        },
      },
    });

    if (existingCode) {
      customerCode = `${customerCode}-${Date.now().toString().slice(-4)}`;
    }

    const newCustomer = await prisma.masterCustomer.create({
      data: {
        tenantId: tenant.id,
        customerCode,
        name: data.name.trim(),
        customerType: data.customerType || "DIRECT_SHIPPER",
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
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath(`/${tenant.subdomain}`);
    revalidatePath(`/${tenant.subdomain}/master`);
    revalidatePath(`/${tenant.subdomain}/jobs/new`);

    return {
      success: true,
      message: `Pelanggan "${newCustomer.name}" (${newCustomer.customerCode}) berhasil ditambahkan.`,
      customerId: newCustomer.id,
    };
  } catch (error) {
    console.error("[createTenantCustomer] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan data pelanggan ke database.",
    };
  }
}

/**
 * Update an existing Customer record
 */
export async function updateTenantCustomer(
  tenantSubdomain: string,
  customerId: string,
  data: Partial<CustomerFormData>
): Promise<CustomerActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    const existing = await prisma.masterCustomer.findFirst({
      where: {
        id: customerId,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Data pelanggan tidak ditemukan atau bukan milik tenant ini." };
    }

    const updated = await prisma.masterCustomer.update({
      where: { id: customerId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.customerType ? { customerType: data.customerType } : {}),
        ...(data.contactPerson !== undefined ? { contactPerson: data.contactPerson?.trim() || null } : {}),
        ...(data.email !== undefined ? { email: data.email?.trim() || null } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.address !== undefined ? { address: data.address?.trim() || null } : {}),
        ...(data.provinceId !== undefined ? { provinceId: data.provinceId || null } : {}),
        ...(data.cityId !== undefined ? { cityId: data.cityId || null } : {}),
        ...(data.districtId !== undefined ? { districtId: data.districtId || null } : {}),
        ...(data.postalCode !== undefined ? { postalCode: data.postalCode?.trim() || null } : {}),
        ...(data.taxId !== undefined ? { taxId: data.taxId?.trim() || null } : {}),
        ...(data.paymentTermDays !== undefined ? { paymentTermDays: Number(data.paymentTermDays) } : {}),
        ...(data.creditLimit !== undefined ? { creditLimit: Number(data.creditLimit) } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    revalidatePath(`/${tenant.subdomain}`);
    revalidatePath(`/${tenant.subdomain}/master`);
    revalidatePath(`/${tenant.subdomain}/jobs/new`);

    return {
      success: true,
      message: `Pelanggan "${updated.name}" berhasil diperbarui.`,
      customerId: updated.id,
    };
  } catch (error) {
    console.error("[updateTenantCustomer] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui data pelanggan.",
    };
  }
}

/**
 * Delete a Customer record
 */
export async function deleteTenantCustomer(
  tenantSubdomain: string,
  customerId: string
): Promise<CustomerActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    const customer = await prisma.masterCustomer.findFirst({
      where: {
        id: customerId,
        tenantId: tenant.id,
      },
      include: {
        _count: {
          select: { jobFiles: true, invoices: true },
        },
      },
    });

    if (!customer) {
      return { success: false, error: "Pelanggan tidak ditemukan atau tidak memiliki hak akses." };
    }

    if (customer._count.jobFiles > 0 || customer._count.invoices > 0) {
      // Soft deactivate if referenced by operational files
      await prisma.masterCustomer.update({
        where: { id: customerId },
        data: { isActive: false },
      });
      revalidatePath(`/${tenant.subdomain}/master`);
      return {
        success: true,
        message: `Pelanggan "${customer.name}" terhubung dengan ${customer._count.jobFiles} Job File. Status diubah menjadi Nonaktif untuk menjaga integritas transaksi.`,
      };
    }

    await prisma.masterCustomer.delete({
      where: { id: customerId },
    });

    revalidatePath(`/${tenant.subdomain}`);
    revalidatePath(`/${tenant.subdomain}/master`);
    revalidatePath(`/${tenant.subdomain}/jobs/new`);

    return {
      success: true,
      message: `Pelanggan "${customer.name}" berhasil dihapus dari database.`,
    };
  } catch (error) {
    console.error("[deleteTenantCustomer] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus data pelanggan.",
    };
  }
}
