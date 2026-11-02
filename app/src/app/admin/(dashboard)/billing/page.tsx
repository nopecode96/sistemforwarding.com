export const dynamic = "force-dynamic";

import { getPlatformBillingOverview } from "@/actions/adminBillingActions";
import { BillingManagementView } from "@/components/admin/BillingManagementView";

export default async function AdminBillingPage() {
  const overview = await getPlatformBillingOverview();

  return <BillingManagementView initialOverview={overview} />;
}
