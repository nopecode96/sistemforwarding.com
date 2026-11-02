export const dynamic = "force-dynamic";

import { getAdminTenantsData } from "@/actions/adminTenantActions";
import { TenantManagementView } from "@/components/admin/TenantManagementView";

export default async function AdminTenantsPage() {
  const { summary, tenants } = await getAdminTenantsData();

  return (
    <TenantManagementView
      initialTenants={tenants}
      initialSummary={summary}
    />
  );
}
