export const dynamic = "force-dynamic";

import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUPERADMIN") {
    const headerList = await headers();
    const host = headerList.get("host") || "";
    if (host.startsWith("admin.")) {
      redirect("/login");
    } else {
      redirect("/admin/login");
    }
  }

  let tenantsCount = 0;
  try {
    tenantsCount = await prisma.tenant.count();
  } catch (error) {
    console.error("[SuperAdminLayout] Error fetching tenant count:", error);
  }

  return (
    <AdminLayoutShell
      tenantsCount={tenantsCount}
      session={{
        name: session.name,
        email: session.email,
        role: session.role,
        tenantId: session.tenantId,
        companyName: session.companyName,
      }}
    >
      {children}
    </AdminLayoutShell>
  );
}
