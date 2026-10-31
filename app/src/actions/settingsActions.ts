"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs/promises";

export interface UploadLogoResult {
  success: boolean;
  logoUrl?: string;
  error?: string;
}

/**
 * uploadTenantLogo
 * Server Action to upload a company branding logo for a tenant.
 * Saves the file into `public/uploads/logos/` and persists `logoUrl` in PostgreSQL.
 */
export async function uploadTenantLogo(
  tenantId: string,
  formData: FormData
): Promise<UploadLogoResult> {
  try {
    if (!tenantId) {
      return { success: false, error: "Tenant ID tidak valid atau kosong." };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return { success: false, error: "Data tenant tidak ditemukan dalam sistem." };
    }

    const file = (formData.get("logo") || formData.get("file")) as File | null;

    if (!file || typeof file === "string" || file.size === 0) {
      return { success: false, error: "Silakan pilih berkas gambar logo untuk diunggah." };
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: "Ukuran berkas logo maksimal 5 MB." };
    }

    // Validate mime type
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return {
        success: false,
        error: "Format berkas tidak didukung. Harap unggah format PNG, JPEG, WEBP, atau SVG.",
      };
    }

    // Determine extension
    let extension = path.extname(file.name).toLowerCase();
    if (!extension || extension === ".") {
      if (file.type === "image/png") extension = ".png";
      else if (file.type === "image/jpeg" || file.type === "image/jpg") extension = ".jpg";
      else if (file.type === "image/webp") extension = ".webp";
      else if (file.type === "image/svg+xml") extension = ".svg";
      else extension = ".png";
    }

    // Build unique filename with tenant subdomain and timestamp
    const sanitizedSubdomain = tenant.subdomain.replace(/[^a-z0-9-]/gi, "");
    const uniqueFilename = `${sanitizedSubdomain}-${Date.now()}${extension}`;

    // Ensure uploads/logos directory exists in public
    const uploadDir = path.join(process.cwd(), "public", "uploads", "logos");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());

    // Write file to disk
    await fs.writeFile(filePath, buffer);

    // Relative web URL accessible via Next.js static asset routing
    const webLogoUrl = `/uploads/logos/${uniqueFilename}`;

    // Update Tenant record in PostgreSQL
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        logoUrl: webLogoUrl,
      },
    });

    console.info(`[uploadTenantLogo] Logo berhasil diperbarui untuk tenant ${tenant.subdomain}: ${webLogoUrl}`);

    try {
      revalidatePath(`/${tenant.subdomain}`);
      revalidatePath(`/${tenant.subdomain}/settings`);
      revalidatePath(`/${tenant.subdomain}/jobs/new`);
      revalidatePath(`/${tenant.subdomain}/finance`);
    } catch {}

    return {
      success: true,
      logoUrl: webLogoUrl,
    };
  } catch (error) {
    console.error("[uploadTenantLogo] Gagal mengunggah logo tenant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan sistem saat mengunggah logo.",
    };
  }
}

export interface TenantGeneralSettingsData {
  companyName: string;
  legalName?: string;
  taxId?: string;
  baseCurrency?: string;
  defaultPaymentTermDays?: number;
  taxCalculationMode?: string;
  defaultTaxId?: string;
}

/**
 * updateTenantGeneralSettings
 * Updates legal profile, functional currency, default TOP, and tax settings in PostgreSQL.
 */
export async function updateTenantGeneralSettings(
  tenantId: string,
  data: TenantGeneralSettingsData
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { financialSettings: true },
    });

    if (!tenant) {
      return { success: false, error: "Tenant tidak ditemukan." };
    }

    // 1. Update Tenant entity
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        companyName: data.companyName.trim(),
        legalName: data.legalName?.trim() || null,
        taxId: data.taxId?.trim() || null,
      },
    });

    // 2. Update or Upsert FinancialSettings
    await prisma.financialSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        baseCurrency: data.baseCurrency || "IDR",
        defaultPaymentTermDays: data.defaultPaymentTermDays
          ? Number(data.defaultPaymentTermDays)
          : 30,
        taxCalculationMode: data.taxCalculationMode || "EXCLUSIVE",
      },
      update: {
        baseCurrency: data.baseCurrency || undefined,
        defaultPaymentTermDays: data.defaultPaymentTermDays
          ? Number(data.defaultPaymentTermDays)
          : undefined,
        taxCalculationMode: data.taxCalculationMode || undefined,
      },
    });

    // 3. If defaultTaxId provided, update MasterTax default flag
    if (data.defaultTaxId) {
      await prisma.$transaction([
        prisma.masterTax.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        }),
        prisma.masterTax.update({
          where: { id: data.defaultTaxId },
          data: { isDefault: true },
        }),
      ]);
    }

    try {
      revalidatePath(`/${tenant.subdomain}`);
      revalidatePath(`/${tenant.subdomain}/settings`);
      revalidatePath(`/${tenant.subdomain}/master`);
      revalidatePath(`/${tenant.subdomain}/jobs/new`);
      revalidatePath(`/${tenant.subdomain}/finance`);
    } catch {}

    return {
      success: true,
      message: "Konfigurasi profil perusahaan dan kebijakan keuangan berhasil diperbarui.",
    };
  } catch (error) {
    console.error("[updateTenantGeneralSettings] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui konfigurasi tenant.",
    };
  }
}

