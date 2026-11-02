export const dynamic = "force-dynamic";

import { getSystemHealthOverview } from "@/actions/adminSystemActions";
import { SystemHealthView } from "@/components/admin/SystemHealthView";

export default async function AdminSystemHealthPage() {
  const data = await getSystemHealthOverview();

  return <SystemHealthView initialData={data} />;
}
