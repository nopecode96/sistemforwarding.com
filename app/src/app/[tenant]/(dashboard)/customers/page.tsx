export const dynamic = "force-dynamic";

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  getTenantCustomers,
  getGeographicalReferences,
} from "@/actions/masterCustomerActions";
import { CustomerCardList } from "@/components/tenant/CustomerCardList";
import {
  Building2,
  Users,
  CreditCard,
  Calendar,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

interface CustomerPageProps {
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

export default async function TenantCustomerPage({ params }: CustomerPageProps) {
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

  // 2. Fetch customer list, stats, and geographic hierarchy in parallel
  const [customerData, geoHierarchy, customerAggregates] = await Promise.all([
    getTenantCustomers(subdomain, { page: 1, limit: 10 }),
    getGeographicalReferences(),
    prisma.masterCustomer.aggregate({
      where: { tenantId: tenant.id },
      _count: { id: true },
      _sum: { creditLimit: true },
      _avg: { paymentTermDays: true },
    }),
  ]);

  const activeCount = await prisma.masterCustomer.count({
    where: { tenantId: tenant.id, isActive: true },
  });

  const totalCustomers = customerAggregates._count.id || 0;
  const totalCreditLimit = Number(customerAggregates._sum.creditLimit || 0);
  const avgTopDays = Math.round(Number(customerAggregates._avg.paymentTermDays || 30));

  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Mengambil Data Customer Terisolasi Ruang Kerja...
          </p>
        </div>
      }
    >
      <div className="w-full min-w-0 space-y-6 font-sans">
        {/* Top Header */}
        <div>
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Direktori Klien &amp; Piutang (AR)</span>
            <span>•</span>
            <span className="font-semibold text-violet-600 dark:text-violet-400 font-mono">
              {tenant.subdomain}.sistemforwarding.com
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Data Customer
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Kelola profil pelanggan pengirim kargo (shipper/consignee), NPWP faktur pajak, Term of Payment (TOP), dan batas plafon piutang dagang.
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#121620] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Customer</span>
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {totalCustomers}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Perusahaan Terdaftar</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121620] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Status Operasional</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {activeCount}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Customer Aktif</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121620] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Plafon Piutang AR</span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono truncate block">
                {formatIDR(totalCreditLimit)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Akumulasi Batas Limit AR</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121620] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Rata-Rata TOP</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {avgTopDays} Hari
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Term of Payment Standar</span>
            </div>
          </div>
        </div>

        {/* Customer Card List Component (Card-Based, No HTML <table>) */}
        <CustomerCardList
          tenantSubdomain={subdomain}
          initialCustomers={customerData.customers}
          initialPagination={customerData.pagination}
          geoHierarchy={geoHierarchy}
        />
      </div>
    </Suspense>
  );
}
