"use server";

import prisma from "@/lib/prisma";

export interface PlanItem {
  id: string | number;
  planKey: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  period: string;
  isPopular?: boolean;
  features: string[];
}

/**
 * getActivePlans
 * Menarik daftar paket harga langganan langsung dari basis data PostgreSQL (PlatformPlan / SystemDictionary).
 */
export async function getActivePlans(): Promise<PlanItem[]> {
  try {
    // 1. Prioritize dynamic PlatformPlan suite (Fase 2)
    const platformPlans = await prisma.platformPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    if (platformPlans.length > 0) {
      return platformPlans.map((p, index) => {
        const codeLower = p.code.toLowerCase();
        return {
          id: p.id || index + 1,
          planKey: codeLower,
          name: p.name,
          price: Number(p.price) || 0,
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          period:
            p.billingCycle === "YEARLY"
              ? "/ tahun"
              : p.billingCycle === "PAY_PER_JOB"
              ? "/ job"
              : p.billingCycle === "MONTHLY"
              ? "/ bulan"
              : "7 Hari",
          isPopular: Boolean(p.isPopular),
          features: Array.isArray(p.features)
            ? (p.features as string[])
            : [
                "Manajemen Job File Kargo",
                "Invoicing & Tagihan Otomatis",
                "Portal Pelanggan Mandiri",
              ],
        };
      });
    }

    // 2. Fallback to SystemDictionary
    const records = await prisma.systemDictionary.findMany({
      where: {
        category: "SUBSCRIPTION_PLAN",
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    if (records.length > 0) {
      return records.map((r, index) => {
        const meta = (r.metadata as Record<string, unknown>) || {};
        const codeLower = r.code.toLowerCase();
        return {
          id: index + 1,
          planKey: codeLower,
          name: r.label,
          price: Number(meta.price) || 0,
          originalPrice: meta.originalPrice ? Number(meta.originalPrice) : null,
          period:
            codeLower === "yearly"
              ? "/ tahun"
              : codeLower === "pay_per_job"
              ? "/ job"
              : codeLower === "monthly"
              ? "/ bulan"
              : "7 Hari",
          isPopular: Boolean(meta.isPopular),
          features: Array.isArray(meta.features)
            ? (meta.features as string[])
            : [
                "Manajemen Job File Kargo",
                "Invoicing & Tagihan Otomatis",
                "Portal Pelanggan Mandiri",
              ],
        };
      });
    }
  } catch (error) {
    console.error("[getActivePlans] Gagal mengambil paket harga dari database:", error);
  }

  // Fallback cadangan bila koneksi database sedang inisialisasi
  return [
    {
      id: 1,
      planKey: "trial",
      name: "Free Trial 7 Hari",
      price: 0,
      originalPrice: null,
      period: "7 Hari",
      features: [
        "Maksimal 15 Job Files aktif",
        "Subdomain mandiri eksklusif",
        "Cetak dokumen BL & AWB draft",
        "Modul pembuatan Invoice",
        "Akses 2 Operator / User",
      ],
    },
    {
      id: 2,
      planKey: "monthly",
      name: "Bisnis Profesional",
      price: 1000000,
      originalPrice: 3000000,
      period: "/ bulan",
      isPopular: true,
      features: [
        "Unlimited Job Files kargo laut, udara, darat",
        "Invoicing instan dengan hitungan PPN 1.1%",
        "Verifikasi QRIS BorderPay otomatis autopilot",
        "Laporan Gross Profit & Dashboard AP/AR",
      ],
    },
    {
      id: 3,
      planKey: "yearly",
      name: "Enterprise Corpora",
      price: 10000000,
      originalPrice: 12000000,
      period: "/ tahun",
      features: [
        "Semua fitur Paket Profesional Bulanan",
        "Public Tracking System & REST API Embed",
        "Hemat komitmen tahunan",
        "Dedicated Account Manager",
      ],
    },
    {
      id: 4,
      planKey: "pay_per_job",
      name: "Pay-Per-Job",
      price: 50000,
      originalPrice: 100000,
      period: "/ job",
      features: [
        "Rp 50.000 per Job File yang dibuat",
        "Ditagih di akhir bulan sesuai pemakaian",
        "Tanpa pembayaran saat onboarding",
        "Akses seluruh modul kargo",
      ],
    },
  ];
}
