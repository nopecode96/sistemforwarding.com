"use server";

import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { createBorderPayQris } from "@/lib/borderpay";
import { revalidatePath } from "next/cache";

export interface TenantSubscriptionInfo {
  subdomain: string;
  companyName: string;
  legalName: string | null;
  subscriptionStatus: string; // 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED'
  subscriptionTier: string;
  billingCycle: string;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  isExpiringSoon: boolean;
  isUrgent: boolean;
  isExpired: boolean;
  formattedExpiryDate: string | null;
  pendingInvoice: {
    id: string;
    invoiceNumber: string;
    planName: string;
    billingPeriod: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    dueDate: string;
    formattedDueDate: string;
    qrisString: string | null;
    paymentMethod: string | null;
  } | null;
}

/**
 * getTenantSubscriptionInfo
 * Mengambil status subscription dan informasi kadaluarsa ruang kerja tenant langsung dari PostgreSQL.
 */
export async function getTenantSubscriptionInfo(
  subdomain: string
): Promise<TenantSubscriptionInfo | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        subdomain: true,
        companyName: true,
        legalName: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        billingCycle: true,
        trialEndsAt: true,
        users: {
          take: 1,
          select: { email: true, name: true },
        },
      },
    });

    if (!tenant) return null;

    const now = new Date();
    let daysRemaining: number | null = null;
    let isExpiringSoon = false;
    let isUrgent = false;
    let isExpired = tenant.subscriptionStatus === "EXPIRED";
    let formattedExpiryDate: string | null = null;

    if (tenant.trialEndsAt) {
      const expiry = new Date(tenant.trialEndsAt);
      daysRemaining = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      formattedExpiryDate = expiry.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (daysRemaining <= 0) {
        isExpired = true;
      } else if (daysRemaining <= 3) {
        isExpiringSoon = true;
        isUrgent = true;
      } else if (daysRemaining <= 7) {
        isExpiringSoon = true;
      }
    }

    // Cari invoice SaaS yang statusnya PENDING (jika ada tagihan belum dibayar)
    const pendingInvoiceRecord = await prisma.platformInvoice.findFirst({
      where: {
        tenantId: tenant.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    let pendingInvoice = null;
    if (pendingInvoiceRecord) {
      pendingInvoice = {
        id: pendingInvoiceRecord.id,
        invoiceNumber: pendingInvoiceRecord.invoiceNumber,
        planName: pendingInvoiceRecord.planName,
        billingPeriod: pendingInvoiceRecord.billingPeriod,
        amount: Number(pendingInvoiceRecord.amount),
        taxAmount: Number(pendingInvoiceRecord.taxAmount),
        totalAmount: Number(pendingInvoiceRecord.totalAmount),
        dueDate: pendingInvoiceRecord.dueDate.toISOString(),
        formattedDueDate: new Date(pendingInvoiceRecord.dueDate).toLocaleDateString(
          "id-ID",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        ),
        qrisString: pendingInvoiceRecord.qrisString,
        paymentMethod: pendingInvoiceRecord.paymentMethod,
      };
    }

    return {
      subdomain: tenant.subdomain,
      companyName: tenant.companyName,
      legalName: tenant.legalName,
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionTier: tenant.subscriptionTier,
      billingCycle: tenant.billingCycle,
      trialEndsAt: tenant.trialEndsAt ? tenant.trialEndsAt.toISOString() : null,
      daysRemaining,
      isExpiringSoon,
      isUrgent,
      isExpired,
      formattedExpiryDate,
      pendingInvoice,
    };
  } catch (error) {
    console.error("[getTenantSubscriptionInfo] Error fetching subscription info:", error);
    return null;
  }
}

/**
 * createTenantRenewalInvoiceAction
 * Membuat invoice perpanjangan langganan SaaS resmi dengan BorderPay QRIS otomatis.
 */
export async function createTenantRenewalInvoiceAction(input: {
  subdomain: string;
  planCode?: string; // 'MONTHLY' | 'YEARLY'
}) {
  try {
    const session = await getCurrentSession();
    if (!session || (session.subdomain !== input.subdomain && session.role !== "SUPERADMIN")) {
      return { success: false, message: "Akses tidak diizinkan." };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: input.subdomain },
      include: {
        users: { take: 1, select: { email: true, name: true } },
      },
    });

    if (!tenant) {
      return { success: false, message: "Ruang kerja tenant tidak ditemukan." };
    }

    // Jika sudah ada invoice pending yang belum kadaluarsa, gunakan kembali
    const existingPending = await prisma.platformInvoice.findFirst({
      where: {
        tenantId: tenant.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingPending && existingPending.qrisString) {
      return {
        success: true,
        invoiceId: existingPending.id,
        invoiceNumber: existingPending.invoiceNumber,
        totalAmount: Number(existingPending.totalAmount),
        qrisString: existingPending.qrisString,
        message: "Invoice aktif ditemukan.",
      };
    }

    const planCode = input.planCode || (tenant.billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY");

    // Ambil harga dari PlatformPlan di database
    let plan = await prisma.platformPlan.findFirst({
      where: { code: planCode, isActive: true },
    });

    if (!plan) {
      // Fallback paket default profesional
      plan = await prisma.platformPlan.findFirst({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    }

    const basePrice = plan ? Number(plan.price) : (planCode === "YEARLY" ? 10000000 : 1000000);
    const planName = plan ? plan.name : (planCode === "YEARLY" ? "Enterprise Corpora (Tahunan)" : "Bisnis Profesional (Bulanan)");
    const billingPeriod = planCode === "YEARLY" ? "1 Tahun Langganan" : "1 Bulan Langganan";

    // Hitung PPN 1.1% (PMK 71/2022)
    const taxRatePercent = 1.1;
    const taxAmount = Math.round((basePrice * taxRatePercent) / 100);
    const totalAmount = basePrice + taxAmount;

    // Nomor invoice unik
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `SAAS-${yearMonth}-${rand}`;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Jatuh tempo 7 hari

    // Generate dynamic QRIS BorderPay
    let qrisString: string | null = null;
    let paymentReference: string | null = null;

    try {
      const qrisRes = await createBorderPayQris({
        amount: totalAmount,
        referenceId: invoiceNumber,
        description: `Perpanjangan Sistem Forwarding ${planName} - ${tenant.companyName}`,
        customerName: tenant.companyName,
        customerEmail: tenant.users[0]?.email,
      });

      if (qrisRes.success && qrisRes.qrisString) {
        qrisString = qrisRes.qrisString;
        paymentReference = qrisRes.referenceId || invoiceNumber;
      }
    } catch (e) {
      console.warn("[createTenantRenewalInvoiceAction] BorderPay QRIS fallback:", e);
    }

    const created = await prisma.platformInvoice.create({
      data: {
        invoiceNumber,
        tenantId: tenant.id,
        planId: plan?.id || null,
        planCode,
        planName,
        billingPeriod,
        amount: basePrice,
        taxAmount,
        totalAmount,
        status: "PENDING",
        dueDate,
        paymentMethod: qrisString ? "QRIS BorderPay" : "TRANSFER_MANUAL",
        paymentReference,
        qrisString,
        notes: `Perpanjangan langganan cloud autopilot untuk ${tenant.companyName}`,
      },
    });

    revalidatePath(`/${tenant.subdomain}`);
    revalidatePath(`/${tenant.subdomain}/settings`);

    return {
      success: true,
      invoiceId: created.id,
      invoiceNumber: created.invoiceNumber,
      totalAmount: Number(created.totalAmount),
      qrisString: created.qrisString,
      message: `Invoice perpanjangan ${created.invoiceNumber} berhasil diterbitkan.`,
    };
  } catch (error: any) {
    console.error("[createTenantRenewalInvoiceAction] Error creating renewal invoice:", error);
    return {
      success: false,
      message: error?.message || "Gagal membuat invoice perpanjangan.",
    };
  }
}

/**
 * checkTenantPaymentStatusAction
 * Memeriksa apakah invoice SaaS sudah terverifikasi lunas
 */
export async function checkTenantPaymentStatusAction(invoiceId: string) {
  try {
    const invoice = await prisma.platformInvoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        status: true,
        paidAt: true,
        tenant: {
          select: {
            subdomain: true,
            subscriptionStatus: true,
            trialEndsAt: true,
          },
        },
      },
    });

    if (!invoice) {
      return { success: false, isPaid: false, message: "Invoice tidak ditemukan." };
    }

    const isPaid = invoice.status === "PAID";

    if (isPaid) {
      revalidatePath(`/${invoice.tenant.subdomain}`);
      revalidatePath(`/${invoice.tenant.subdomain}/settings`);
    }

    return {
      success: true,
      isPaid,
      status: invoice.status,
      paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
      tenantStatus: invoice.tenant.subscriptionStatus,
      newExpiry: invoice.tenant.trialEndsAt ? invoice.tenant.trialEndsAt.toISOString() : null,
      message: isPaid
        ? "Pembayaran telah berhasil diverifikasi! Langganan Anda aktif kembali."
        : "Pembayaran belum terdeteksi. Silakan lakukan pembayaran QRIS.",
    };
  } catch (error) {
    console.error("[checkTenantPaymentStatusAction] Error checking status:", error);
    return { success: false, isPaid: false, message: "Gagal memeriksa status pembayaran." };
  }
}
