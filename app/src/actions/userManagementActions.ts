"use server";

import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UserActionResult {
  success: boolean;
  message?: string;
  error?: string;
  userId?: string;
}

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
 * Get users for a tenant with pagination and optional search
 */
export async function getTenantUsers(
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
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where: whereCondition }),
    prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    tenant,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || "-",
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
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
 * Create a new user for tenant
 */
export async function createTenantUser(
  tenantSubdomain: string,
  data: UserFormData
): Promise<UserActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    if (!data.name || data.name.trim() === "") {
      return { success: false, error: "Nama pengguna wajib diisi." };
    }
    if (!data.email || !data.email.includes("@")) {
      return { success: false, error: "Alamat email tidak valid." };
    }

    const email = data.email.trim().toLowerCase();

    // Check email uniqueness within tenant
    const existing = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email,
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Pengguna dengan email ${email} sudah terdaftar pada ruang kerja ini.`,
      };
    }

    const newUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: data.name.trim(),
        email,
        phone: data.phone?.trim() || null,
        role: data.role || UserRole.OPERATOR,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath(`/${tenant.subdomain}/users`);

    return {
      success: true,
      message: `Pengguna "${newUser.name}" (${newUser.role}) berhasil ditambahkan ke tim.`,
      userId: newUser.id,
    };
  } catch (error) {
    console.error("[createTenantUser] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menambahkan pengguna baru.",
    };
  }
}

/**
 * Update an existing tenant user
 */
export async function updateTenantUser(
  tenantSubdomain: string,
  userId: string,
  data: Partial<UserFormData>
): Promise<UserActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    const existing = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Pengguna tidak ditemukan dalam ruang kerja ini." };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    revalidatePath(`/${tenant.subdomain}/users`);

    return {
      success: true,
      message: `Data pengguna "${updated.name}" berhasil diperbarui.`,
      userId: updated.id,
    };
  } catch (error) {
    console.error("[updateTenantUser] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui data pengguna.",
    };
  }
}

/**
 * Toggle user active status
 */
export async function toggleTenantUserStatus(
  tenantSubdomain: string,
  userId: string
): Promise<UserActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    const existing = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !existing.isActive },
    });

    revalidatePath(`/${tenant.subdomain}/users`);

    return {
      success: true,
      message: `Status akun ${updated.name} diubah menjadi ${updated.isActive ? "Aktif" : "Nonaktif"}.`,
    };
  } catch (error) {
    console.error("[toggleTenantUserStatus] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengubah status pengguna.",
    };
  }
}

/**
 * Delete a user from tenant
 */
export async function deleteTenantUser(
  tenantSubdomain: string,
  userId: string
): Promise<UserActionResult> {
  try {
    const tenant = await resolveTenant(tenantSubdomain);

    // Guard: Prevent deleting the last active TENANT_ADMIN
    const adminCount = await prisma.user.count({
      where: {
        tenantId: tenant.id,
        role: UserRole.TENANT_ADMIN,
        isActive: true,
      },
    });

    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: tenant.id,
      },
    });

    if (!targetUser) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    if (targetUser.role === UserRole.TENANT_ADMIN && adminCount <= 1) {
      return {
        success: false,
        error: "Tidak dapat menghapus Tenant Admin terakhir. Tunjuk admin baru terlebih dahulu.",
      };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath(`/${tenant.subdomain}/users`);

    return {
      success: true,
      message: `Akses pengguna "${targetUser.name}" berhasil dihapus.`,
    };
  } catch (error) {
    console.error("[deleteTenantUser] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus pengguna.",
    };
  }
}
