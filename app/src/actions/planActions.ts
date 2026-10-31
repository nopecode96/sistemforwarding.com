"use server";

import prisma from "@/lib/prisma";

export interface PlanItem {
  id: string | number;
  planKey: string;
  name: string;
  price: number;
  period: string;
  isPopular?: boolean;
  features: string[];
}

/**
 * getActivePlans
 * Menarik daftar paket harga langganan langsung dari basis data PostgreSQL (SystemDictionary).
 */
export async function getActivePlans(): Promise<PlanItem[]> {
  try {
    const records = await prisma.systemDictionary.findMany({
      where: {
        category: "SUBSCRIPTION_PLAN",
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    if (records.length > 0) {
      return records.map((r, index) => {
        const meta = (r.metadata as Record<string, any>) || {};
        const codeLower = r.code.toLowerCase();
        return {
          id: index + 1,
          planKey: codeLower,
          name: r.label,
          price: Number(meta.price) || 0,
          period:
            codeLower === "yearly"
              ? "/ tahun"
              : codeLower === "monthly"
              ? "/ bulan"
              : "7 Hari",
          isPopular: Boolean(meta.isPopular),
          features: Array.isArray(meta.features)
            ? meta.features
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
      name: "Starter Trial",
      price: 0,
      period: "7 Hari",
      features: [
        "Manajemen Job File Kargo",
        "Cetak Dokumen Dasar HBL/AWB",
        "Portal Pelanggan Mandiri",
      ],
    },
    {
      id: 2,
      planKey: "monthly",
      name: "Bisnis Profesional",
      price: 1000000,
      period: "/ bulan",
      isPopular: true,
      features: [
        "Unlimited Job File Kargo",
        "Invoicing & Tagihan Otomatis",
        "Laporan Laba/Rugi Real-Time",
        "Notifikasi WhatsApp & Email",
      ],
    },
    {
      id: 3,
      planKey: "yearly",
      name: "Enterprise",
      price: 10000000,
      period: "/ tahun",
      features: [
        "Semua Fitur Profesional",
        "Custom Template Dokumen Pengiriman",
        "Dedicated Account Support",
        "Prioritas Setup & Bantuan 24/7",
      ],
    },
  ];
}
