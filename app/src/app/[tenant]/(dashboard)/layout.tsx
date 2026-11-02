export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { TenantShell } from "@/components/tenant/TenantShell";
import { ImpersonationBanner } from "@/components/tenant/ImpersonationBanner";
import { getCurrentSession } from "@/lib/auth";
import { getTenantSubscriptionInfo } from "@/actions/tenantSubscriptionActions";
import Link from "next/link";
import { Ban } from "lucide-react";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenant } = await params;
  const session = await getCurrentSession();
  const isSuperAdmin = session && session.role === "SUPERADMIN";
  const isImpersonating = Boolean(session?.isImpersonating || session?.originalSuperAdmin);
  const operatorName = session?.originalSuperAdmin?.name || "Super Administrator";

  // Dynamically resolve tenant company metadata from PostgreSQL database
  let companyName =
    tenant.charAt(0).toUpperCase() + tenant.slice(1) + " Logistics";
  let subscriptionStatus = "ACTIVE";
  let isActive = true;
  let logoUrl: string | null = null;
  let userName: string | undefined = session?.name || undefined;
  let userEmail: string | undefined = session?.email || undefined;
  let userRole: string | undefined = isImpersonating
    ? "Super Admin (Impersonating)"
    : session?.role === "SUPERADMIN"
    ? "Super Administrator"
    : session?.role === "TENANT_ADMIN"
    ? "Tenant Admin"
    : session?.role
    ? "Operator"
    : undefined;

  let subscriptionInfo = null;
  try {
    const [tenantRecord, subInfo] = await Promise.all([
      prisma.tenant.findUnique({
        where: { subdomain: tenant },
        select: {
          companyName: true,
          subscriptionStatus: true,
          isActive: true,
          logoUrl: true,
          users: {
            take: 1,
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      getTenantSubscriptionInfo(tenant),
    ]);

    subscriptionInfo = subInfo;

    if (tenantRecord) {
      companyName = tenantRecord.companyName;
      subscriptionStatus = tenantRecord.subscriptionStatus;
      isActive = tenantRecord.isActive;
      logoUrl = tenantRecord.logoUrl;
      if (!userName && tenantRecord.users && tenantRecord.users.length > 0) {
        userName = tenantRecord.users[0].name;
        userEmail = tenantRecord.users[0].email;
        userRole = tenantRecord.users[0].role === "TENANT_ADMIN" ? "Tenant Admin" : "Operator";
      }
    }
  } catch (error) {
    console.error("[Tenant Layout] Error resolving tenant company name:", error);
  }

  // If workspace is suspended, lock regular users out
  if ((!isActive || subscriptionStatus === "SUSPENDED") && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto">
            <Ban className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">Ruang Kerja Ditangguhkan</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Akses ke ruang kerja <strong className="text-white">{companyName}</strong> sementara dinonaktifkan oleh administrator platform. Silakan hubungi tim SistemForwarding untuk penyelesaian tagihan atau pemulihan akses.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Link
              href="/login"
              className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
            >
              Ganti Akun / Login Ulang
            </Link>
            <a
              href="https://sistemforwarding.com"
              className="text-xs text-amber-400 hover:underline"
            >
              Kembali ke SistemForwarding.com
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isImpersonating && (
        <ImpersonationBanner
          tenantName={companyName}
          operatorName={operatorName}
        />
      )}
      <TenantShell
        tenant={tenant}
        companyName={companyName}
        subscriptionStatus={subscriptionStatus}
        logoUrl={logoUrl}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        isImpersonating={isImpersonating}
        subscriptionInfo={subscriptionInfo}
      >
        {children}
      </TenantShell>
    </>
  );
}
