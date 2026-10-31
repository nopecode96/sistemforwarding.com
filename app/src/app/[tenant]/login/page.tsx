import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TenantLoginForm } from "@/components/tenant/TenantLoginForm";
import { ShieldCheck, ArrowLeft, Building2 } from "lucide-react";

interface TenantLoginPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantLoginPage({ params }: TenantLoginPageProps) {
  const { tenant } = await params;

  // Resolve tenant info from PostgreSQL
  const tenantData = await prisma.tenant.findUnique({
    where: { subdomain: tenant },
    select: {
      subdomain: true,
      companyName: true,
      legalName: true,
      logoUrl: true,
      subscriptionStatus: true,
      users: {
        select: { email: true, name: true, role: true },
        take: 2,
      },
    },
  });

  if (!tenantData) {
    notFound();
  }

  const defaultEmail = tenantData.users[0]?.email || `admin@${tenant}.com`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top back navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 px-4 sm:px-0">
        <Link
          href="https://sistemforwarding.com"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Utama</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {/* Workspace Card Container */}
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20">
          {/* Tenant White-Label Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-4">
              {tenantData.logoUrl ? (
                <Image
                  src={tenantData.logoUrl}
                  alt={tenantData.companyName}
                  width={40}
                  height={40}
                  className="rounded-xl object-contain"
                />
              ) : (
                <Building2 className="w-7 h-7" />
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-[11px] font-bold tracking-wide uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Portal Ruang Kerja Mandiri</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {tenantData.companyName}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {tenantData.subdomain}.sistemforwarding.com
            </p>
          </div>

          {/* Interactive Client Form Component */}
          <TenantLoginForm
            subdomain={tenantData.subdomain}
            companyName={tenantData.companyName}
            defaultEmail={defaultEmail}
          />

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sesi Terenkripsi &bull; Database Terisolasi</span>
          </div>
        </div>

        {/* Tenant Switcher Helper */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Bukan perusahaan Anda?{" "}
          <Link
            href="https://sistemforwarding.com/login"
            className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
          >
            Cari Ruang Kerja Lain
          </Link>
        </p>
      </div>
    </div>
  );
}
