export const dynamic = "force-dynamic";

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTenantVendors } from "@/actions/masterVendorActions";
import { getGeographicalReferences } from "@/actions/masterCustomerActions";
import { VendorCardList } from "@/components/tenant/VendorCardList";
import {
  Truck,
  Ship,
  Plane,
  ShieldCheck,
  CreditCard,
  DollarSign,
} from "lucide-react";

interface VendorPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function TenantVendorPage({ params }: VendorPageProps) {
  const { tenant: subdomain } = await params;

  // 1. Verify tenant existence in PostgreSQL
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: {
      id: true,
      subdomain: true,
      companyName: true,
    },
  });

  if (!tenant) {
    notFound();
  }

  // 2. Fetch vendor list, stats, and geographic hierarchy in parallel
  const [vendorData, geoHierarchy, vendorAggregates] = await Promise.all([
    getTenantVendors(subdomain, { page: 1, limit: 10 }),
    getGeographicalReferences(),
    prisma.masterVendor.aggregate({
      where: { tenantId: tenant.id },
      _count: { id: true },
      _sum: { creditLimit: true },
    }),
  ]);

  const totalVendors = vendorAggregates._count.id || 0;
  const totalCreditLimit = Number(vendorAggregates._sum.creditLimit || 0);

  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Mengambil Data Vendor Terisolasi Ruang Kerja...
          </p>
        </div>
      }
    >
      <div className="w-full min-w-0 space-y-6 font-sans">
        {/* Top Header */}
        <div>
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Mitra Transportasi &amp; Hutang (AP)</span>
            <span>•</span>
            <span className="font-semibold text-violet-600 dark:text-violet-400 font-mono">
              {tenant.subdomain}.sistemforwarding.com
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Mitra Vendor
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Kelola daftar mitra pelayaran kapal laut, maskapai kargo udara, vendor armada truk (haulage), PPJK kepabeanan, dan nomor rekening pembayaran AP.
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#121620] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Vendor AP</span>
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {totalVendors}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Mitra Terdaftar</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121620] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pelayaran Laut (Sea)</span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Ship className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {vendorData.categoryStats?.sea || 0}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Carrier Kapal Laut</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121620] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Maskapai Udara (Air)</span>
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                <Plane className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">
                {vendorData.categoryStats?.air || 0}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Airlines Kargo</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121620] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Armada Truk &amp; PPJK</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {(vendorData.categoryStats?.truck || 0) + (vendorData.categoryStats?.broker || 0)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Trucking &amp; Kepabeanan</span>
            </div>
          </div>
        </div>

        {/* Vendor Card List Component (Card-Based, No HTML <table>) */}
        <VendorCardList
          tenantSubdomain={subdomain}
          initialVendors={vendorData.vendors as any}
          initialPagination={vendorData.pagination}
          geoHierarchy={geoHierarchy}
          categoryStats={vendorData.categoryStats}
        />
      </div>
    </Suspense>
  );
}
