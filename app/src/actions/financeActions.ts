"use server";

import prisma from "@/lib/prisma";
import { PrefixType, BillingStatus, InvoiceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface FinanceDashboardStats {
  tenant: {
    id: string;
    subdomain: string;
    companyName: string;
  };
  totalAR: number; // Piutang dari Customer (Selling)
  totalAP: number; // Hutang ke Vendor Carrier (Buying)
  grossProfit: number;
  grossProfitMargin: number;
  totalInvoicesCount: number;
  paidAmount: number;
  unpaidAmount: number;
  unbilledJobsCount: number;
  unbilledJobs: Array<{
    id: string;
    jobFileNumber: string;
    customer: { id: string; name: string; customerCode: string };
    vendor: { id: string; name: string; category: string } | null;
    originPort: string;
    destinationPort: string;
    transportMode: string;
    vesselOrFlight: string | null;
    packageCount: number | null;
    packageType: string | null;
    grossWeightKg: number | null;
    volumeWeightCbm: number | null;
    sellingAmount: number;
    buyingAmount: number;
    billingStatus: string;
    createdAt: Date;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    jobFileNumber: string;
    customerName: string;
    invoiceDate: Date;
    dueDate: Date;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: InvoiceStatus;
    paidAt: Date | null;
    paymentMethod: string | null;
    cargoSummary: string | null;
  }>;
}

export interface GenerateInvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  error?: string;
}

/**
 * Resolves Tenant by subdomain or CUID
 */
async function resolveTenant(tenantIdentifier: string) {
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ id: tenantIdentifier }, { subdomain: tenantIdentifier }],
    },
  });

  if (!tenant) {
    throw new Error(`Tenant '${tenantIdentifier}' tidak ditemukan.`);
  }

  return tenant;
}

/**
 * 1. getFinanceDashboardStats
 * Aggregates Total AR (Piutang Customer) & Total AP (Hutang Vendor),
 * calculating Gross Profit & Margin across tenant Job Files.
 */
export async function getFinanceDashboardStats(
  tenantIdentifier: string
): Promise<FinanceDashboardStats> {
  const tenant = await resolveTenant(tenantIdentifier);

  // 1. Fetch all Job Files for this tenant
  const jobFiles = await prisma.jobFile.findMany({
    where: { tenantId: tenant.id },
    include: {
      customer: { select: { id: true, name: true, customerCode: true } },
      vendor: { select: { id: true, name: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate totals
  let totalAR = 0;
  let totalAP = 0;
  const unbilledJobs: FinanceDashboardStats["unbilledJobs"] = [];

  for (const job of jobFiles) {
    const selling = Number(job.sellingAmount || 0);
    const buying = Number(job.buyingAmount || 0);
    totalAR += selling;
    totalAP += buying;

    if (job.billingStatus === BillingStatus.UNBILLED || job.billingStatus === BillingStatus.PARTIALLY_BILLED) {
      unbilledJobs.push({
        id: job.id,
        jobFileNumber: job.jobFileNumber,
        customer: job.customer,
        vendor: job.vendor,
        originPort: job.originPort,
        destinationPort: job.destinationPort,
        transportMode: job.transportMode,
        vesselOrFlight: job.vesselOrFlight,
        packageCount: job.packageCount,
        packageType: job.packageType,
        grossWeightKg: job.grossWeightKg ? Number(job.grossWeightKg) : null,
        volumeWeightCbm: job.volumeWeightCbm ? Number(job.volumeWeightCbm) : null,
        sellingAmount: selling,
        buyingAmount: buying,
        billingStatus: job.billingStatus,
        createdAt: job.createdAt,
      });
    }
  }

  const grossProfit = totalAR - totalAP;
  const grossProfitMargin = totalAR > 0 ? (grossProfit / totalAR) * 100 : 0;

  // 2. Fetch Invoices for this tenant
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: tenant.id },
    include: {
      jobFile: { select: { jobFileNumber: true } },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let paidAmount = 0;
  let unpaidAmount = 0;

  const recentInvoices: FinanceDashboardStats["recentInvoices"] = invoices.map((inv) => {
    const total = Number(inv.totalAmount || 0);
    if (inv.status === InvoiceStatus.PAID) {
      paidAmount += total;
    } else if (inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.PARTIALLY_PAID) {
      unpaidAmount += total;
    }

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      jobFileNumber: inv.jobFile.jobFileNumber,
      customerName: inv.customer.name,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      subtotal: Number(inv.subtotal),
      taxAmount: Number(inv.taxAmount),
      totalAmount: total,
      status: inv.status,
      paidAt: inv.paidAt,
      paymentMethod: inv.paymentMethod,
      cargoSummary: inv.cargoSummary,
    };
  });

  return {
    tenant: {
      id: tenant.id,
      subdomain: tenant.subdomain,
      companyName: tenant.companyName,
    },
    totalAR,
    totalAP,
    grossProfit,
    grossProfitMargin: Number(grossProfitMargin.toFixed(1)),
    totalInvoicesCount: invoices.length,
    paidAmount,
    unpaidAmount,
    unbilledJobsCount: unbilledJobs.length,
    unbilledJobs,
    recentInvoices,
  };
}

/**
 * 2. generateInvoice
 * Reads cargo specs from JobFile, auto-increments MasterPrefix (type: INVOICE),
 * calculates tax (PPN Besaran Tertentu 1.1%), and persists the commercial Invoice.
 */
export async function generateInvoice(
  jobFileId: string
): Promise<GenerateInvoiceResult> {
  try {
    if (!jobFileId) {
      return { success: false, error: "Parameter jobFileId wajib disertakan." };
    }

    // 1. Fetch JobFile with customer & billing party details
    const jobFile = await prisma.jobFile.findUnique({
      where: { id: jobFileId },
      include: {
        customer: true,
        billingParty: true,
        tenant: true,
      },
    });

    if (!jobFile) {
      return { success: false, error: "Job File tidak ditemukan." };
    }

    const tenantId = jobFile.tenantId;
    const billedCustomer = jobFile.billingParty || jobFile.customer;
    const billedCustomerId = billedCustomer.id;

    // 2. Build cargo summary snapshot with reference numbers
    const cargoDetails = [
      jobFile.customerRefNo ? `Ref: ${jobFile.customerRefNo}` : null,
      jobFile.shippingInstructionNo ? `SI: ${jobFile.shippingInstructionNo}` : null,
      jobFile.commercialInvoiceNo ? `CI: ${jobFile.commercialInvoiceNo}` : null,
      jobFile.containerSummary,
      `${jobFile.packageCount || 1} ${jobFile.packageType || "PKG"}`,
      jobFile.grossWeightKg ? `${jobFile.grossWeightKg} Kgs` : null,
      jobFile.volumeWeightCbm ? `${jobFile.volumeWeightCbm} CBM` : null,
      jobFile.vesselOrFlight ? `Vessel: ${jobFile.vesselOrFlight}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    // 3. Tax & Financial Calculation dynamically retrieved from PostgreSQL MasterTax
    const defaultTax = await prisma.masterTax.findFirst({
      where: { tenantId, isDefault: true, isActive: true },
    });
    const subtotal = Number(jobFile.sellingAmount || 0);
    const taxRatePercent = defaultTax ? Number(defaultTax.taxRatePercent) : 1.1;
    const taxAmount = Math.round(subtotal * (taxRatePercent / 100));
    const totalAmount = subtotal + taxAmount;
    const taxId = defaultTax ? defaultTax.id : null;

    // Due date (default 30 days or based on billed customer paymentTermDays)
    const termDays = billedCustomer.paymentTermDays || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + termDays);

    // 4. Atomic Transaction: MasterPrefix increment + Invoice generation + JobFile update
    const invoice = await prisma.$transaction(async (tx) => {
      // Find or create MasterPrefix config for INVOICE
      let prefixConfig = await tx.masterPrefix.findUnique({
        where: {
          tenantId_prefixType: {
            tenantId,
            prefixType: PrefixType.INVOICE,
          },
        },
      });

      if (!prefixConfig) {
        prefixConfig = await tx.masterPrefix.create({
          data: {
            tenantId,
            prefixType: PrefixType.INVOICE,
            prefixCode: "INV",
            zeroPadding: 5,
            currentSequence: 0,
            formatPattern: "{PREFIX}/{YEAR}/{SEQ}",
          },
        });
      }

      const nextSequence = prefixConfig.currentSequence + 1;

      // Update sequence counter
      await tx.masterPrefix.update({
        where: { id: prefixConfig.id },
        data: {
          currentSequence: nextSequence,
          lastResetAt: new Date(),
        },
      });

      // Format Invoice Number based on dynamic DB MasterPrefix
      const now = new Date();
      const invoiceNumber = (prefixConfig.formatPattern || "{PREFIX}/{YEAR}/{SEQ}")
        .replace("{PREFIX}", prefixConfig.prefixCode || "INV")
        .replace("{YEAR}", String(now.getFullYear()))
        .replace("{MONTH}", String(now.getMonth() + 1).padStart(2, "0"))
        .replace("{SEQ}", String(nextSequence).padStart(prefixConfig.zeroPadding || 5, "0"));

      // Create relational Invoice record
      const createdInvoice = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          jobFileId: jobFile.id,
          customerId: billedCustomerId,
          invoiceDate: new Date(),
          dueDate,
          currency: jobFile.currency || "IDR",
          subtotal,
          taxId,
          taxRatePercent,
          taxAmount,
          totalAmount,
          status: InvoiceStatus.UNPAID,
          cargoSummary: cargoDetails || "Freight Forwarding Services",
          notes: `Invoice penagihan resmi untuk Job File ${jobFile.jobFileNumber}. Term: ${termDays} hari.`,
        },
      });

      // Update JobFile billing status
      await tx.jobFile.update({
        where: { id: jobFile.id },
        data: {
          billingStatus: BillingStatus.FULLY_BILLED,
        },
      });

      return createdInvoice;
    });

    console.info(
      `[Invoice Generated] Created Invoice ${invoice.invoiceNumber} for JobFile ${jobFile.jobFileNumber} (${formatIDRNumber(totalAmount)})`
    );

    try {
      revalidatePath(`/${jobFile.tenant.subdomain}/finance`);
      revalidatePath(`/${jobFile.tenant.subdomain}`);
    } catch {
      // Ignored if outside HTTP context
    }

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount,
    };
  } catch (error) {
    console.error("[generateInvoice] Error generating invoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat invoice.",
    };
  }
}

/**
 * 3. updatePaymentStatus
 * Marks invoice as PAID, recording settlement timestamp and syncing JobFile billingStatus.
 */
export async function updatePaymentStatus(
  invoiceId: string,
  status: "PAID" | "UNPAID" | "CANCELLED",
  paymentMethod: string = "QRIS BorderPay"
): Promise<{ success: boolean; error?: string }> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { tenant: true },
    });

    if (!invoice) {
      return { success: false, error: "Invoice tidak ditemukan." };
    }

    const isPaid = status === "PAID";

    await prisma.$transaction(async (tx) => {
      // 1. Update Invoice
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: isPaid ? InvoiceStatus.PAID : status === "CANCELLED" ? InvoiceStatus.CANCELLED : InvoiceStatus.UNPAID,
          paidAt: isPaid ? new Date() : null,
          paymentMethod: isPaid ? paymentMethod : null,
        },
      });

      // 2. Sync associated JobFile
      await tx.jobFile.update({
        where: { id: invoice.jobFileId },
        data: {
          billingStatus: isPaid ? BillingStatus.PAID : BillingStatus.FULLY_BILLED,
        },
      });
    });

    try {
      revalidatePath(`/${invoice.tenant.subdomain}/finance`);
      revalidatePath(`/${invoice.tenant.subdomain}`);
    } catch {
      // Ignored if outside HTTP context
    }

    return { success: true };
  } catch (error) {
    console.error("[updatePaymentStatus] Error updating payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui status pembayaran.",
    };
  }
}

function formatIDRNumber(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}
