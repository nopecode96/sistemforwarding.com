import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function getStatusDetails(status: string) {
  switch (status) {
    case "BOOKED":
      return { label: "Booking Terkonfirmasi", step: 1, color: "blue" };
    case "IN_TRANSIT":
      return { label: "Dalam Perjalanan (In Transit)", step: 2, color: "cyan" };
    case "CUSTOMS_CLEARANCE":
      return { label: "Pemeriksaan Kepabeanan (Customs)", step: 3, color: "violet" };
    case "ARRIVED":
      return { label: "Tiba di Pelabuhan / Bandara Tujuan", step: 4, color: "indigo" };
    case "DELIVERED":
    case "CLOSED":
    case "INVOICED":
      return { label: "Terkirim ke Consignee (Delivered)", step: 5, color: "emerald" };
    case "CANCELLED":
      return { label: "Kiriman Dibatalkan", step: 0, color: "rose" };
    case "DRAFT":
    default:
      return { label: "Pesanan Diterima (Draft)", step: 1, color: "amber" };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    const { tenant: subdomain } = await params;
    const url = req.nextUrl;
    const query = (url.searchParams.get("q") || url.searchParams.get("no") || "").trim();

    if (!subdomain) {
      return NextResponse.json(
        { success: false, error: "Subdomain perusahaan wajib ditentukan." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1. Resolve Tenant
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        companyName: true,
        legalName: true,
        logoUrl: true,
        subdomain: true,
        isActive: true,
      },
    });

    if (!tenant || !tenant.isActive) {
      return NextResponse.json(
        { success: false, error: "Perusahaan Forwarding tidak ditemukan atau belum aktif." },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor resi/pencarian wajib diisi (contoh: No. AWB, No. B/L, No. Kontainer, atau No. Job File).",
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 2. Query Job with comprehensive multi-field matching within tenant scope
    const job = await prisma.jobFile.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { jobFileNumber: { equals: query, mode: "insensitive" } },
          { houseBillOfLading: { equals: query, mode: "insensitive" } },
          { masterBillOfLading: { equals: query, mode: "insensitive" } },
          { shippingInstructionNo: { equals: query, mode: "insensitive" } },
          { customerRefNo: { equals: query, mode: "insensitive" } },
          { containerSummary: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        cargoDetails: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: `Data kiriman dengan nomor "${query}" tidak ditemukan. Pastikan nomor yang dimasukkan sudah benar.`,
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const statusInfo = getStatusDetails(job.status);

    // 3. Construct 5-tier standard freight milestone steps
    const currentStep = statusInfo.step;
    const milestones = [
      {
        step: 1,
        title: "Pesanan Kargo Dibuat & Dipesan",
        desc: "Dokumen Shipping Instruction & Job File telah terdaftar dalam sistem.",
        date: job.bookingDate ? job.bookingDate.toISOString() : job.createdAt.toISOString(),
        isCompleted: currentStep >= 1,
        isCurrent: currentStep === 1,
      },
      {
        step: 2,
        title:
          job.transportMode === "SEA"
            ? "Kapal Berlayar (Vessel Sailing)"
            : job.transportMode === "AIR"
            ? "Penerbangan Berangkat (Flight Departed)"
            : "Armada Berangkat (In Transit)",
        desc: `${job.vesselOrFlight || "Carrier"} (${job.voyageOrFlightNo || "Reguler"}) berangkat dari ${job.originPort}.`,
        date: job.atd ? job.atd.toISOString() : job.etd ? job.etd.toISOString() : null,
        isCompleted: currentStep >= 2,
        isCurrent: currentStep === 2,
      },
      {
        step: 3,
        title: "Pemeriksaan Kepabeanan (Customs Clearance)",
        desc: "Pemberitahuan Ekspor/Impor Barang & verifikasi dokumen bea cukai.",
        date: null,
        isCompleted: currentStep >= 3,
        isCurrent: currentStep === 3,
      },
      {
        step: 4,
        title: "Tiba di Pelabuhan / Bandara Tujuan",
        desc: `Kargo telah bersandar / tiba di ${job.destinationPort}.`,
        date: job.ata ? job.ata.toISOString() : job.eta ? job.eta.toISOString() : null,
        isCompleted: currentStep >= 4,
        isCurrent: currentStep === 4,
      },
      {
        step: 5,
        title: "Kargo Selesai Diserahterimakan (Delivered)",
        desc: "Pengiriman barang telah tuntas diterima oleh pihak Consignee.",
        date: job.status === "DELIVERED" || job.status === "CLOSED" ? job.updatedAt.toISOString() : null,
        isCompleted: currentStep >= 5,
        isCurrent: currentStep === 5,
      },
    ];

    // 4. Sanitize and Return ONLY Public Logistics Information (Zero Financials)
    const trackingPayload = {
      trackingNumber: job.houseBillOfLading || job.masterBillOfLading || job.jobFileNumber,
      jobFileNumber: job.jobFileNumber,
      houseBillOfLading: job.houseBillOfLading,
      masterBillOfLading: job.masterBillOfLading,
      shippingInstructionNo: job.shippingInstructionNo,
      customerRefNo: job.customerRefNo,
      transportMode: job.transportMode,
      status: job.status,
      statusLabel: statusInfo.label,
      currentStep: statusInfo.step,
      carrierOrVessel: job.vesselOrFlight || "Carrier Resmi",
      voyageOrFlightNo: job.voyageOrFlightNo,
      originPort: job.originPort,
      destinationPort: job.destinationPort,
      transitPort: job.transitPort,
      bookingDate: job.bookingDate,
      etd: job.etd,
      atd: job.atd,
      eta: job.eta,
      ata: job.ata,
      packages: {
        count: job.packageCount || 1,
        type: job.packageType || "Colly",
        grossWeightKg: job.grossWeightKg ? Number(job.grossWeightKg) : null,
        volumeWeightCbm: job.volumeWeightCbm ? Number(job.volumeWeightCbm) : null,
        containerSummary: job.containerSummary,
        commodity: job.commodityDescription || "General Cargo",
      },
      milestones,
      company: {
        name: tenant.companyName,
        legalName: tenant.legalName,
        logoUrl: tenant.logoUrl,
        subdomain: tenant.subdomain,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: trackingPayload,
      },
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("[Tracking API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi gangguan saat memproses pencarian kiriman.",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
