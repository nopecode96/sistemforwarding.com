export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { TenantShell } from "@/components/tenant/TenantShell";

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

  // Dynamically resolve tenant company metadata from PostgreSQL database
  let companyName =
    tenant.charAt(0).toUpperCase() + tenant.slice(1) + " Logistics";
  let subscriptionStatus = "ACTIVE";
  let logoUrl: string | null = null;
  let userName: string | undefined = undefined;
  let userEmail: string | undefined = undefined;
  let userRole: string | undefined = undefined;

  try {
    const tenantRecord = await prisma.tenant.findUnique({
      where: { subdomain: tenant },
      select: {
        companyName: true,
        subscriptionStatus: true,
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
    });

    if (tenantRecord) {
      companyName = tenantRecord.companyName;
      subscriptionStatus = tenantRecord.subscriptionStatus;
      logoUrl = tenantRecord.logoUrl;
      if (tenantRecord.users && tenantRecord.users.length > 0) {
        userName = tenantRecord.users[0].name;
        userEmail = tenantRecord.users[0].email;
        userRole = tenantRecord.users[0].role === "TENANT_ADMIN" ? "Tenant Admin" : "Operator";
      }
    }
  } catch (error) {
    console.error("[Tenant Layout] Error resolving tenant company name:", error);
  }

  return (
    <TenantShell
      tenant={tenant}
      companyName={companyName}
      subscriptionStatus={subscriptionStatus}
      logoUrl={logoUrl}
      userName={userName}
      userEmail={userEmail}
      userRole={userRole}
    >
      {children}
    </TenantShell>
  );
}
