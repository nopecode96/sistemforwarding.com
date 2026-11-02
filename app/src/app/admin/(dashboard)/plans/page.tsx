export const dynamic = "force-dynamic";

import { getPlatformPlans } from "@/actions/adminBillingActions";
import { PlansManagementView } from "@/components/admin/PlansManagementView";

export default async function AdminPlansPage() {
  const plans = await getPlatformPlans();

  return <PlansManagementView initialPlans={plans} />;
}
