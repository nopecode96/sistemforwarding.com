export const dynamic = "force-dynamic";

import { getAdminBroadcasts } from "@/actions/adminBroadcastActions";
import { BroadcastManagementView } from "@/components/admin/BroadcastManagementView";

export default async function AdminBroadcastsPage() {
  const data = await getAdminBroadcasts();

  return <BroadcastManagementView initialData={data} />;
}
