export const dynamic = "force-dynamic";

import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTenantUsers } from "@/actions/userManagementActions";
import { UserCardList } from "@/components/tenant/UserCardList";
import { Users, Shield, Wallet, Ship } from "lucide-react";

interface UsersPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantUsersPage({ params }: UsersPageProps) {
  const { tenant: subdomain } = await params;

  // 1. Resolve tenant
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

  // 2. Fetch users directly from PostgreSQL (Strict Zero Mock Data)
  const userData = await getTenantUsers(subdomain, { page: 1, limit: 10 });

  // 3. Calculate telemetry stats per role
  const totalCount = userData.users.length;
  const adminCount = userData.users.filter((u) => u.role === "TENANT_ADMIN").length;
  const financeCount = userData.users.filter((u) => u.role === "FINANCE").length;
  const operatorCount = userData.users.filter((u) => u.role === "OPERATOR").length;

  return (
    <div className="w-full min-w-0 space-y-6 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Struktur Tim &amp; Hak Akses</span>
          <span>•</span>
          <span className="font-semibold text-violet-600 dark:text-violet-400 font-mono">
            {tenant.subdomain}.sistemforwarding.com
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Data User &amp; Hak Akses
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Tata kelola hak akses tim operasional freight forwarding, staf akuntansi faktur, dan administrator ruang kerja.
            </p>
          </div>
        </div>
      </div>

      {/* Role Telemetry Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Pengguna
            </span>
            <div className="h-8 w-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalCount}
          </p>
          <span className="text-[10px] text-slate-400">Terdaftar di Ruang Kerja</span>
        </div>

        {/* Tenant Admins */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Tenant Admin
            </span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {adminCount}
          </p>
          <span className="text-[10px] text-slate-400">Otoritas Penuh Sistem</span>
        </div>

        {/* Finance & Invoicing */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Finance &amp; Pajak
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {financeCount}
          </p>
          <span className="text-[10px] text-slate-400">Tagihan &amp; PPN 1.1%</span>
        </div>

        {/* Ops Cargo */}
        <div className="bg-white dark:bg-[#121620] rounded-3xl border border-slate-200/80 dark:border-white/[0.08] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Operator Kargo
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
              <Ship className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {operatorCount}
          </p>
          <span className="text-[10px] text-slate-400">Job File &amp; Tracking BL</span>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">
              Memuat data pengguna ruang kerja...
            </p>
          </div>
        }
      >
        <UserCardList
          tenantSubdomain={tenant.subdomain}
          companyName={tenant.companyName}
          initialUsers={userData.users}
          initialPagination={userData.pagination}
        />
      </Suspense>
    </div>
  );
}
