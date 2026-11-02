"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import {
  createAffiliateSessionToken,
  setAffiliateSessionCookie,
  clearAffiliateSessionCookie,
  getAffiliateSession,
} from "@/lib/affiliate-auth";
import { getCurrentSession } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/hostinger";
import { AffiliateStatus, AffiliatePayoutStatus } from "@prisma/client";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

function verifyPassword(plain: string, hash: string | null): boolean {
  if (!hash) return false;
  const hashed = hashPassword(plain);
  return hash === hashed || hash === plain.trim();
}

function sanitizeCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);
}

// ==============================================================================
// 1. PUBLIC REGISTRATION & AUTHENTICATION
// ==============================================================================

export interface RegisterAffiliateInput {
  fullName: string;
  email: string;
  phone: string;
  occupation: string;
  companyName?: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  preferredCode: string;
  password: string;
}

export async function registerAffiliateAction(input: RegisterAffiliateInput) {
  try {
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim().replace(/^0/, "62").replace(/[^0-9]/g, "");
    const preferredCode = sanitizeCode(input.preferredCode || fullName.split(" ")[0] + "20");
    const password = input.password.trim();

    if (!fullName || !email || !phone || !input.bankAccountNumber || !password) {
      return { success: false, error: "Mohon lengkapi semua kolom yang wajib diisi." };
    }

    if (password.length < 6) {
      return { success: false, error: "Password minimal 6 karakter." };
    }

    // Check email uniqueness
    const existingEmail = await prisma.affiliate.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return { success: false, error: "Email sudah terdaftar dalam program afiliasi." };
    }

    // Check code uniqueness
    let finalCode = preferredCode;
    const existingCode = await prisma.affiliate.findUnique({
      where: { code: finalCode },
    });
    if (existingCode) {
      finalCode = `${preferredCode}${Math.floor(100 + Math.random() * 900)}`;
    }

    const passwordHash = hashPassword(password);

    const affiliate = await prisma.affiliate.create({
      data: {
        code: finalCode,
        fullName,
        email,
        phone,
        passwordHash,
        occupation: input.occupation.trim(),
        companyName: input.companyName?.trim() || null,
        bankName: input.bankName.trim().toUpperCase(),
        bankAccountNumber: input.bankAccountNumber.trim(),
        bankAccountName: input.bankAccountName.trim().toUpperCase(),
        status: AffiliateStatus.PENDING,
        commissionRate: 20.0,
      },
    });

    console.info(
      `[Affiliate Registration] New affiliate application: ${affiliate.fullName} (${affiliate.code})`
    );

    // Send WhatsApp confirmation to affiliate applicant
    try {
      await sendWhatsApp({
        recipientPhone: phone,
        message: `Halo *${fullName}*,\n\nTerima kasih telah mendaftar di *Program Afiliasi B2B sistemforwarding.com*.\n\nKode Usulan: *${finalCode}*\nStatus: *Menunggu Verifikasi Super Admin*\n\nTim kami akan segera memverifikasi data Anda dalam 1x24 jam. Anda akan menerima pemberitahuan begitu akun diaktifkan.`,
      });
    } catch (waErr) {
      console.warn("[Affiliate Action] WhatsApp notification skipped:", waErr);
    }

    return {
      success: true,
      message: "Pendaftaran berhasil! Akun Anda sedang diverifikasi oleh tim Super Admin.",
      code: finalCode,
    };
  } catch (err: any) {
    console.error("[Affiliate Action] registerAffiliateAction error:", err);
    return { success: false, error: err.message || "Terjadi kesalahan saat memproses pendaftaran." };
  }
}

export async function loginAffiliateAction(identifier: string, passwordPlain: string) {
  try {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanId.replace(/^0/, "62").replace(/[^0-9]/g, "");

    const affiliate = await prisma.affiliate.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { phone: cleanPhone },
          { code: cleanId.toUpperCase() },
        ],
      },
    });

    if (!affiliate) {
      return { success: false, error: "Akun afiliasi tidak ditemukan. Periksa email/no WhatsApp Anda." };
    }

    if (affiliate.status === AffiliateStatus.PENDING) {
      return {
        success: false,
        error: "Pendaftaran akun Anda masih dalam status PENINJAUAN oleh Super Admin. Harap tunggu persetujuan.",
      };
    }

    if (affiliate.status === AffiliateStatus.REJECTED || affiliate.status === AffiliateStatus.SUSPENDED) {
      return {
        success: false,
        error: `Akun Anda sedang ${affiliate.status === AffiliateStatus.REJECTED ? "ditolak" : "dinonaktifkan"}. Hubungi customer support.`,
      };
    }

    const isMatch = verifyPassword(passwordPlain, affiliate.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Password atau kredensial yang Anda masukkan salah." };
    }

    const token = await createAffiliateSessionToken({
      affiliateId: affiliate.id,
      email: affiliate.email,
      fullName: affiliate.fullName,
      code: affiliate.code,
    });

    await setAffiliateSessionCookie(token);

    return { success: true };
  } catch (err: any) {
    console.error("[Affiliate Action] loginAffiliateAction error:", err);
    return { success: false, error: err.message || "Gagal masuk ke portal afiliasi." };
  }
}

export async function logoutAffiliateAction() {
  await clearAffiliateSessionCookie();
  return { success: true };
}

// ==============================================================================
// 2. AFFILIATE PORTAL DATA & WITHDRAWAL
// ==============================================================================

export async function getAffiliatePortalData() {
  const session = await getAffiliateSession();
  if (!session) {
    return { authenticated: false, data: null };
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: session.affiliateId },
    include: {
      referredTenants: {
        select: {
          id: true,
          companyName: true,
          subdomain: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      commissions: {
        orderBy: { createdAt: "desc" },
      },
      payouts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!affiliate) {
    return { authenticated: false, data: null };
  }

  // Financial calculations
  const totalEarned = affiliate.commissions.reduce(
    (acc, curr) => acc + Number(curr.commissionAmount),
    0
  );

  const totalPaidPayouts = affiliate.payouts
    .filter((p) => p.status === AffiliatePayoutStatus.PAID)
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const pendingPayouts = affiliate.payouts
    .filter(
      (p) =>
        p.status === AffiliatePayoutStatus.PENDING ||
        p.status === AffiliatePayoutStatus.PROCESSING
    )
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const availableBalance = Math.max(0, totalEarned - totalPaidPayouts - pendingPayouts);

  // Mask tenant names for privacy: e.g. "PT Samudera Logistik Indonesia" -> "PT Sam*** Ind***"
  const maskedTenants = affiliate.referredTenants.map((t) => {
    const words = t.companyName.split(" ");
    const masked = words
      .map((w) => (w.length > 3 ? `${w.slice(0, 3)}***` : w))
      .join(" ");

    return {
      id: t.id,
      companyNameMasked: masked,
      subscriptionTier: t.subscriptionTier,
      subscriptionStatus: t.subscriptionStatus,
      createdAt: t.createdAt.toISOString(),
    };
  });

  return {
    authenticated: true,
    data: {
      id: affiliate.id,
      fullName: affiliate.fullName,
      email: affiliate.email,
      phone: affiliate.phone,
      code: affiliate.code,
      occupation: affiliate.occupation,
      companyName: affiliate.companyName,
      bankName: affiliate.bankName,
      bankAccountNumber: affiliate.bankAccountNumber,
      bankAccountName: affiliate.bankAccountName,
      commissionRate: Number(affiliate.commissionRate),
      totalClicks: affiliate.totalClicks,
      stats: {
        totalReferred: affiliate.referredTenants.length,
        activePaying: affiliate.referredTenants.filter(
          (t) => t.subscriptionStatus === "ACTIVE"
        ).length,
        totalEarned,
        totalPaidPayouts,
        pendingPayouts,
        availableBalance,
      },
      tenants: maskedTenants,
      commissions: affiliate.commissions.map((c) => ({
        id: c.id,
        invoiceAmount: Number(c.invoiceAmount),
        commissionAmount: Number(c.commissionAmount),
        status: c.status,
        notes: c.notes,
        createdAt: c.createdAt.toISOString(),
      })),
      payouts: affiliate.payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        bankName: p.bankName,
        bankAccountNumber: p.bankAccountNumber,
        bankAccountName: p.bankAccountName,
        notes: p.notes,
        transferProofUrl: p.transferProofUrl,
        createdAt: p.createdAt.toISOString(),
        processedAt: p.processedAt?.toISOString() || null,
      })),
    },
  };
}

export async function requestAffiliatePayoutAction(amount: number, notes?: string) {
  try {
    const session = await getAffiliateSession();
    if (!session) {
      return { success: false, error: "Sesi telah kedaluwarsa. Silakan masuk kembali." };
    }

    if (!amount || amount < 200000) {
      return { success: false, error: "Batas penarikan dana minimum adalah Rp 200.000." };
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: session.affiliateId },
      include: {
        commissions: true,
        payouts: true,
      },
    });

    if (!affiliate) {
      return { success: false, error: "Data afiliator tidak ditemukan." };
    }

    const totalEarned = affiliate.commissions.reduce(
      (acc, curr) => acc + Number(curr.commissionAmount),
      0
    );
    const usedFunds = affiliate.payouts
      .filter((p) => p.status !== AffiliatePayoutStatus.REJECTED)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const available = totalEarned - usedFunds;

    if (amount > available) {
      return {
        success: false,
        error: `Saldo tidak mencukupi. Saldo tersedia Anda saat ini adalah Rp ${available.toLocaleString("id-ID")}.`,
      };
    }

    const payout = await prisma.affiliatePayout.create({
      data: {
        affiliateId: affiliate.id,
        amount,
        status: AffiliatePayoutStatus.PENDING,
        bankName: affiliate.bankName,
        bankAccountNumber: affiliate.bankAccountNumber,
        bankAccountName: affiliate.bankAccountName,
        notes: notes?.trim() || null,
      },
    });

    revalidatePath("/affiliate/portal");

    return {
      success: true,
      message: `Permintaan penarikan dana sebesar Rp ${amount.toLocaleString("id-ID")} berhasil diajukan dan sedang diproses admin.`,
      payoutId: payout.id,
    };
  } catch (err: any) {
    console.error("[Affiliate Action] requestAffiliatePayoutAction error:", err);
    return { success: false, error: err.message || "Gagal memproses pengajuan penarikan dana." };
  }
}

// ==============================================================================
// 3. SUPER ADMIN GOVERNANCE & APPROVAL
// ==============================================================================

export async function getAdminAffiliatesData() {
  const superSession = await getCurrentSession();
  if (!superSession || superSession.role !== "SUPERADMIN") {
    throw new Error("Unauthorized Super Admin access");
  }

  const [affiliates, payouts, commissions] = await Promise.all([
    prisma.affiliate.findMany({
      include: {
        referredTenants: {
          select: {
            id: true,
            companyName: true,
            subdomain: true,
            subscriptionStatus: true,
            subscriptionTier: true,
            createdAt: true,
          },
        },
        commissions: true,
        payouts: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.affiliatePayout.findMany({
      include: {
        affiliate: {
          select: {
            id: true,
            fullName: true,
            code: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.affiliateCommission.findMany({
      include: {
        affiliate: {
          select: {
            id: true,
            fullName: true,
            code: true,
          },
        },
        tenant: {
          select: {
            id: true,
            companyName: true,
            subdomain: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const summary = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter((a) => a.status === AffiliateStatus.APPROVED).length,
    pendingApplications: affiliates.filter((a) => a.status === AffiliateStatus.PENDING).length,
    totalCommissionsPaid: commissions.reduce((acc, c) => acc + Number(c.commissionAmount), 0),
    pendingPayoutsCount: payouts.filter((p) => p.status === AffiliatePayoutStatus.PENDING).length,
    pendingPayoutsAmount: payouts
      .filter((p) => p.status === AffiliatePayoutStatus.PENDING)
      .reduce((acc, p) => acc + Number(p.amount), 0),
  };

  return {
    summary,
    affiliates: affiliates.map((a) => {
      const earned = a.commissions.reduce((acc, c) => acc + Number(c.commissionAmount), 0);
      const paid = a.payouts
        .filter((p) => p.status === AffiliatePayoutStatus.PAID)
        .reduce((acc, p) => acc + Number(p.amount), 0);
      return {
        id: a.id,
        code: a.code,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        occupation: a.occupation,
        companyName: a.companyName,
        bankName: a.bankName,
        bankAccountNumber: a.bankAccountNumber,
        bankAccountName: a.bankAccountName,
        commissionRate: Number(a.commissionRate),
        status: a.status,
        totalClicks: a.totalClicks,
        totalReferred: a.referredTenants.length,
        activeReferred: a.referredTenants.filter((t) => t.subscriptionStatus === "ACTIVE").length,
        totalEarned: earned,
        availableBalance: Math.max(0, earned - paid),
        createdAt: a.createdAt.toISOString(),
      };
    }),
    payouts: payouts.map((p) => ({
      id: p.id,
      affiliateId: p.affiliateId,
      affiliateName: p.affiliate.fullName,
      affiliateCode: p.affiliate.code,
      affiliatePhone: p.affiliate.phone,
      amount: Number(p.amount),
      status: p.status,
      bankName: p.bankName,
      bankAccountNumber: p.bankAccountNumber,
      bankAccountName: p.bankAccountName,
      notes: p.notes,
      transferProofUrl: p.transferProofUrl,
      createdAt: p.createdAt.toISOString(),
      processedAt: p.processedAt?.toISOString() || null,
    })),
    commissions: commissions.map((c) => ({
      id: c.id,
      affiliateName: c.affiliate.fullName,
      affiliateCode: c.affiliate.code,
      tenantName: c.tenant.companyName,
      tenantSubdomain: c.tenant.subdomain,
      invoiceAmount: Number(c.invoiceAmount),
      commissionAmount: Number(c.commissionAmount),
      status: c.status,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export async function approveAffiliateAction(
  affiliateId: string,
  customCode?: string,
  customRate?: number
) {
  const superSession = await getCurrentSession();
  if (!superSession || superSession.role !== "SUPERADMIN") {
    return { success: false, error: "Akses Super Admin diperlukan." };
  }

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });
    if (!affiliate) {
      return { success: false, error: "Data afiliator tidak ditemukan." };
    }

    const code = customCode ? sanitizeCode(customCode) : affiliate.code;
    const commissionRate = customRate !== undefined ? Number(customRate) : Number(affiliate.commissionRate);

    const updated = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        status: AffiliateStatus.APPROVED,
        code,
        commissionRate,
      },
    });

    // Send instant WhatsApp notification
    if (updated.phone) {
      try {
        const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "sistemforwarding.com";
        await sendWhatsApp({
          recipientPhone: updated.phone,
          message: `🎉 *SELAMAT! Akun Afiliasi Anda Telah Disetujui!*\n\nHalo *${updated.fullName}*,\nPermohonan kemitraan afiliasi B2B Anda di *sistemforwarding.com* telah disetujui.\n\n🔗 *Link Referral Anda:*\nhttps://${rootDomain}/?ref=${updated.code}\n\n📊 *Persentase Komisi: ${commissionRate}% Recurring (12 Bulan)*\n\nLogin ke Portal Afiliasi untuk memantau klik dan saldo komisi:\nhttps://${rootDomain}/affiliate/login\n\nSelamat mengumpulkan komisi bersama ekosistem freight forwarding Indonesia!`,
        });
      } catch (waErr) {
        console.warn("[Affiliate Action] WhatsApp notification failed:", waErr);
      }
    }

    revalidatePath("/admin/affiliates");
    return { success: true, message: `Afiliator ${updated.fullName} berhasil disetujui dengan kode ${updated.code}.` };
  } catch (err: any) {
    console.error("[Affiliate Action] approveAffiliateAction error:", err);
    return { success: false, error: err.message || "Gagal menyetujui afiliator." };
  }
}

export async function rejectAffiliateAction(affiliateId: string, reason?: string) {
  const superSession = await getCurrentSession();
  if (!superSession || superSession.role !== "SUPERADMIN") {
    return { success: false, error: "Akses Super Admin diperlukan." };
  }

  try {
    const updated = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        status: AffiliateStatus.REJECTED,
        rejectionReason: reason?.trim() || "Tidak memenuhi kriteria kurasi kemitraan.",
      },
    });

    revalidatePath("/admin/affiliates");
    return { success: true, message: `Afiliasi ${updated.fullName} ditolak.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menolak afiliator." };
  }
}

export async function processPayoutAction(
  payoutId: string,
  action: "APPROVE" | "REJECT",
  notes?: string,
  proofUrl?: string
) {
  const superSession = await getCurrentSession();
  if (!superSession || superSession.role !== "SUPERADMIN") {
    return { success: false, error: "Akses Super Admin diperlukan." };
  }

  try {
    const payout = await prisma.affiliatePayout.findUnique({
      where: { id: payoutId },
      include: { affiliate: true },
    });

    if (!payout) {
      return { success: false, error: "Permintaan penarikan tidak ditemukan." };
    }

    const newStatus =
      action === "APPROVE" ? AffiliatePayoutStatus.PAID : AffiliatePayoutStatus.REJECTED;

    const updated = await prisma.affiliatePayout.update({
      where: { id: payoutId },
      data: {
        status: newStatus,
        processedAt: new Date(),
        notes: notes?.trim() || null,
        transferProofUrl: proofUrl?.trim() || null,
      },
    });

    if (action === "APPROVE" && payout.affiliate.phone) {
      try {
        await sendWhatsApp({
          recipientPhone: payout.affiliate.phone,
          message: `💸 *Dana Komisi Telah Ditransfer!*\n\nHalo *${payout.affiliate.fullName}*,\nPenarikan dana komisi sebesar *Rp ${Number(payout.amount).toLocaleString("id-ID")}* telah berhasil ditransfer ke rekening ${payout.bankName} (${payout.bankAccountNumber} a/n ${payout.bankAccountName}).\n\nTerima kasih atas dedikasi Anda merekomendasikan sistemforwarding.com!`,
        });
      } catch (waErr) {
        console.warn("[Affiliate Action] WhatsApp notification failed:", waErr);
      }
    }

    revalidatePath("/admin/affiliates");
    return {
      success: true,
      message: `Penarikan dana ${action === "APPROVE" ? "telah disetujui & ditandai lunas" : "ditolak"}.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memproses penarikan dana." };
  }
}
