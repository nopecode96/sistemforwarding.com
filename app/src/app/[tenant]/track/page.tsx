import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { TrackingWidgetView, TrackingData } from '@/components/tenant/TrackingWidgetView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TrackingPageProps {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{
    q?: string;
    no?: string;
    embed?: string;
  }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: TrackingPageProps): Promise<Metadata> {
  const { tenant: subdomain } = await params;
  const { q, no } = await searchParams;
  const query = (q || no || '').trim();

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { companyName: true },
  });

  if (!tenant) {
    return { title: 'Lacak Kiriman Kargo' };
  }

  return {
    title: query
      ? `Lacak Kiriman #${query} | ${tenant.companyName}`
      : `Lacak Status Kiriman Kargo | ${tenant.companyName}`,
    description: `Portal pelacakan kargo resmi real-time ${tenant.companyName}. Periksa status pergerakan barang, jadwal pelayaran/penerbangan, dan estimasi kedatangan.`,
  };
}

export default async function TenantTrackingPage({
  params,
  searchParams,
}: TrackingPageProps) {
  const { tenant: subdomain } = await params;
  const { q, no, embed } = await searchParams;
  const cleanQuery = (q || no || '').trim();
  const isEmbed = embed === 'true' || embed === '1';

  // 1. Resolve Tenant
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: {
      id: true,
      subdomain: true,
      companyName: true,
      legalName: true,
      logoUrl: true,
      isActive: true,
    },
  });

  if (!tenant || !tenant.isActive) {
    notFound();
  }

  // 2. Query Initial Job if query parameter provided
  let initialData: TrackingData | null = null;

  if (cleanQuery) {
    const job = await prisma.jobFile.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { jobFileNumber: { equals: cleanQuery, mode: 'insensitive' } },
          { houseBillOfLading: { equals: cleanQuery, mode: 'insensitive' } },
          { masterBillOfLading: { equals: cleanQuery, mode: 'insensitive' } },
          { shippingInstructionNo: { equals: cleanQuery, mode: 'insensitive' } },
          { customerRefNo: { equals: cleanQuery, mode: 'insensitive' } },
          { containerSummary: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        cargoDetails: true,
      },
    });

    if (job) {
      let statusLabel = 'Dalam Proses';
      let currentStep = 1;

      switch (job.status) {
        case 'BOOKED':
          statusLabel = 'Booking Terkonfirmasi';
          currentStep = 1;
          break;
        case 'IN_TRANSIT':
          statusLabel = 'Dalam Perjalanan (In Transit)';
          currentStep = 2;
          break;
        case 'CUSTOMS_CLEARANCE':
          statusLabel = 'Pemeriksaan Kepabeanan (Customs)';
          currentStep = 3;
          break;
        case 'ARRIVED':
          statusLabel = 'Tiba di Pelabuhan / Bandara Tujuan';
          currentStep = 4;
          break;
        case 'DELIVERED':
        case 'CLOSED':
        case 'INVOICED':
          statusLabel = 'Terkirim ke Consignee (Delivered)';
          currentStep = 5;
          break;
        case 'CANCELLED':
          statusLabel = 'Kiriman Dibatalkan';
          currentStep = 0;
          break;
        case 'DRAFT':
        default:
          statusLabel = 'Pesanan Diterima (Draft)';
          currentStep = 1;
          break;
      }

      initialData = {
        trackingNumber:
          job.houseBillOfLading || job.masterBillOfLading || job.jobFileNumber,
        jobFileNumber: job.jobFileNumber,
        houseBillOfLading: job.houseBillOfLading,
        masterBillOfLading: job.masterBillOfLading,
        shippingInstructionNo: job.shippingInstructionNo,
        customerRefNo: job.customerRefNo,
        transportMode: job.transportMode,
        status: job.status,
        statusLabel,
        currentStep,
        carrierOrVessel: job.vesselOrFlight || 'Carrier Resmi',
        voyageOrFlightNo: job.voyageOrFlightNo,
        originPort: job.originPort,
        destinationPort: job.destinationPort,
        transitPort: job.transitPort,
        bookingDate: job.bookingDate ? job.bookingDate.toISOString() : null,
        etd: job.etd ? job.etd.toISOString() : null,
        atd: job.atd ? job.atd.toISOString() : null,
        eta: job.eta ? job.eta.toISOString() : null,
        ata: job.ata ? job.ata.toISOString() : null,
        packages: {
          count: job.packageCount || 1,
          type: job.packageType || 'Colly',
          grossWeightKg: job.grossWeightKg ? Number(job.grossWeightKg) : null,
          volumeWeightCbm: job.volumeWeightCbm
            ? Number(job.volumeWeightCbm)
            : null,
          containerSummary: job.containerSummary,
          commodity: job.commodityDescription || 'General Cargo',
        },
        milestones: [
          {
            step: 1,
            title: 'Pesanan Kargo Dibuat & Dipesan',
            desc: 'Dokumen Shipping Instruction & Job File telah terdaftar dalam sistem.',
            date: job.bookingDate
              ? job.bookingDate.toISOString()
              : job.createdAt.toISOString(),
            isCompleted: currentStep >= 1,
            isCurrent: currentStep === 1,
          },
          {
            step: 2,
            title:
              job.transportMode === 'SEA'
                ? 'Kapal Berlayar (Vessel Sailing)'
                : job.transportMode === 'AIR'
                ? 'Penerbangan Berangkat (Flight Departed)'
                : 'Armada Berangkat (In Transit)',
            desc: `${job.vesselOrFlight || 'Carrier'} (${job.voyageOrFlightNo || 'Reguler'}) berangkat dari ${job.originPort}.`,
            date: job.atd
              ? job.atd.toISOString()
              : job.etd
              ? job.etd.toISOString()
              : null,
            isCompleted: currentStep >= 2,
            isCurrent: currentStep === 2,
          },
          {
            step: 3,
            title: 'Pemeriksaan Kepabeanan (Customs Clearance)',
            desc: 'Pemberitahuan Ekspor/Impor Barang & verifikasi dokumen bea cukai.',
            date: null,
            isCompleted: currentStep >= 3,
            isCurrent: currentStep === 3,
          },
          {
            step: 4,
            title: 'Tiba di Pelabuhan / Bandara Tujuan',
            desc: `Kargo telah bersandar / tiba di ${job.destinationPort}.`,
            date: job.ata
              ? job.ata.toISOString()
              : job.eta
              ? job.eta.toISOString()
              : null,
            isCompleted: currentStep >= 4,
            isCurrent: currentStep === 4,
          },
          {
            step: 5,
            title: 'Kargo Selesai Diserahterimakan (Delivered)',
            desc: 'Pengiriman barang telah tuntas diterima oleh pihak Consignee.',
            date:
              job.status === 'DELIVERED' || job.status === 'CLOSED'
                ? job.updatedAt.toISOString()
                : null,
            isCompleted: currentStep >= 5,
            isCurrent: currentStep === 5,
          },
        ],
        company: {
          name: tenant.companyName,
          legalName: tenant.legalName,
          logoUrl: tenant.logoUrl,
          subdomain: tenant.subdomain,
        },
      };
    }
  }

  return (
    <TrackingWidgetView
      tenant={{
        companyName: tenant.companyName,
        legalName: tenant.legalName,
        logoUrl: tenant.logoUrl,
        subdomain: tenant.subdomain,
      }}
      initialData={initialData}
      initialQuery={cleanQuery}
      isEmbed={isEmbed}
    />
  );
}
